import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface Schedule {
  id: string;
  item_id: string;
  freq_type: string;
  times: string[];
  days_of_week: number[] | null;
  is_active: boolean;
  items: {
    id: string;
    user_id: string;
    name: string;
    is_active: boolean;
    treatment_end_date: string | null;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('X-Cron-Secret');
    let targetUserId: string | null = null;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If user auth, get their ID
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        targetUserId = data.user.id;
      }
    }
    
    // Check authorization: either valid user token, or valid cron secret
    const validCron = cronSecret === Deno.env.get('CRON_SECRET');
    const hasUserAuth = targetUserId !== null;
    
    if (!validCron && !hasUserAuth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body for optional parameters
    let body: { days?: number; user_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body, use defaults
    }

    const daysToGenerate = body.days || 7;
    if (body.user_id && !targetUserId) {
      targetUserId = body.user_id;
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + daysToGenerate * 24 * 60 * 60 * 1000);

    console.log(`[GenerateDoses] Starting for ${targetUserId || 'all users'}, ${daysToGenerate} days`);

    // Fetch active schedules
    let query = supabaseAdmin
      .from('schedules')
      .select(`
        id,
        item_id,
        freq_type,
        times,
        days_of_week,
        is_active,
        items!inner (
          id,
          user_id,
          name,
          is_active,
          treatment_end_date
        )
      `)
      .eq('is_active', true)
      .eq('items.is_active', true);

    if (targetUserId) {
      query = query.eq('items.user_id', targetUserId);
    }

    const { data: schedules, error: schedulesError } = await query;

    if (schedulesError) {
      console.error('[GenerateDoses] Error fetching schedules:', schedulesError);
      throw schedulesError;
    }

    if (!schedules || schedules.length === 0) {
      console.log('[GenerateDoses] No active schedules found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active schedules', generated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GenerateDoses] Found ${schedules.length} active schedules`);

    // Get existing dose instances to avoid duplicates
    const scheduleIds = schedules.map(s => s.id);
    const { data: existingDoses } = await supabaseAdmin
      .from('dose_instances')
      .select('schedule_id, due_at')
      .in('schedule_id', scheduleIds)
      .gte('due_at', now.toISOString())
      .lte('due_at', endDate.toISOString());

    const existingSet = new Set(
      existingDoses?.map(d => `${d.schedule_id}_${d.due_at}`) || []
    );

    console.log(`[GenerateDoses] Found ${existingSet.size} existing dose instances`);

    const newDoses: Array<{
      schedule_id: string;
      item_id: string;
      due_at: string;
      status: string;
    }> = [];

    for (const schedule of schedules) {
      const item = Array.isArray(schedule.items) ? schedule.items[0] : schedule.items;
      
      if (!item?.is_active) continue;

      // Check treatment end date
      if (item.treatment_end_date && new Date(item.treatment_end_date) < now) {
        continue;
      }

      const times = Array.isArray(schedule.times) ? schedule.times : [];
      
      for (let day = 0; day < daysToGenerate; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        
        // Reset to start of day
        date.setHours(0, 0, 0, 0);
        
        // Check if this day matches the schedule
        const dayOfWeek = date.getDay();
        
        if (schedule.freq_type === 'specific_days' || schedule.freq_type === 'weekly') {
          if (schedule.days_of_week && !schedule.days_of_week.includes(dayOfWeek)) {
            continue;
          }
        }

        for (const time of times) {
          if (typeof time !== 'string') continue;
          
          const [hours, minutes] = time.split(':').map(Number);
          const dueAt = new Date(date);
          dueAt.setHours(hours, minutes, 0, 0);

          // Skip if in the past
          if (dueAt <= now) continue;

          // Skip if beyond treatment end date
          if (item.treatment_end_date && dueAt > new Date(item.treatment_end_date)) {
            continue;
          }

          // Check for duplicate
          const key = `${schedule.id}_${dueAt.toISOString()}`;
          if (existingSet.has(key)) continue;

          newDoses.push({
            schedule_id: schedule.id,
            item_id: schedule.item_id,
            due_at: dueAt.toISOString(),
            status: 'scheduled',
          });

          existingSet.add(key);
        }
      }
    }

    console.log(`[GenerateDoses] Inserting ${newDoses.length} new doses`);

    if (newDoses.length > 0) {
      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < newDoses.length; i += batchSize) {
        const batch = newDoses.slice(i, i + batchSize);
        const { error: insertError } = await supabaseAdmin
          .from('dose_instances')
          .insert(batch);

        if (insertError) {
          console.error('[GenerateDoses] Error inserting batch:', insertError);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[GenerateDoses] Done in ${duration}ms. Generated ${newDoses.length} doses for ${schedules.length} schedules`);

    return new Response(
      JSON.stringify({
        success: true,
        generated: newDoses.length,
        schedules_processed: schedules.length,
        days: daysToGenerate,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GenerateDoses] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
