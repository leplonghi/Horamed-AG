/**
 * Email Templates for Reward Notifications
 * Generates HTML emails with embedded badge images
 */

interface RewardEmailData {
  userName: string;
  rewardTitle: string;
  rewardDescription: string;
  badgeImage: string;
  streakDays?: number;
  level?: string;
}

const BADGE_IMAGES = {
  streak7: "/images/rewards/badge-7days.png",
  streak30: "/images/rewards/badge-30days.png",
  perfectWeek: "/images/rewards/perfect-week.png",
  series: "/images/rewards/series-icon.png",
  premiumCrown: "/images/rewards/premium-crown.png",
  protectionShield: "/images/rewards/protection-shield.png",
};

/**
 * Generate HTML email for streak achievement
 */
export function generateStreakAchievementEmail(data: RewardEmailData): string {
  const baseUrl = window.location.origin;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Conquista no HoraMed!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #059669 0%, #6366f1 50%, #ec4899 100%); padding: 40px 20px; text-align: center;">
        <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🎉 Parabéns!</h1>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Você desbloqueou uma nova conquista</p>
      </td>
    </tr>
    
    <!-- Badge Image -->
    <tr>
      <td style="padding: 40px 20px; text-align: center; background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), white);">
        <img src="${baseUrl}${data.badgeImage}" alt="${data.rewardTitle}" style="width: 200px; height: 200px; margin: 0 auto; display: block; animation: bounce 2s infinite;" />
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 0 40px 40px;">
        <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 28px; text-align: center;">${data.rewardTitle}</h2>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">${data.rewardDescription}</p>
        
        ${data.streakDays ? `
        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1)); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Sua Série</p>
          <p style="margin: 0; color: #059669; font-size: 48px; font-weight: bold;">${data.streakDays}</p>
          <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">dias consecutivos</p>
        </div>
        ` : ''}
        
        ${data.level ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${data.level}</span>
        </div>
        ` : ''}
        
        <div style="text-align: center;">
          <a href="${baseUrl}/conquistas" style="display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);">Ver Todas as Conquistas</a>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Continue assim! Cada dose tomada é um passo em direção à sua saúde.</p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">HoraMed - Seu aliado na saúde</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email for premium reward
 */
export function generatePremiumRewardEmail(data: RewardEmailData): string {
  const baseUrl = window.location.origin;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recompensa Premium Desbloqueada!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
        <img src="${baseUrl}/images/rewards/premium-crown.png" alt="Premium" style="width: 80px; height: 80px; margin: 0 auto 16px; display: block;" />
        <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">👑 Recompensa Premium!</h1>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Você ganhou créditos HoraMed</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 28px; text-align: center;">${data.rewardTitle}</h2>
        <p style="margin: 0 0 32px; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">${data.rewardDescription}</p>
        
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1)); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px;">
          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Seus Créditos</p>
          <p style="margin: 0; color: #10b981; font-size: 48px; font-weight: bold;">R$ XX,XX</p>
          <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">disponíveis para usar</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${baseUrl}/recompensas" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">Ver Minhas Recompensas</a>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">Use seus créditos na próxima renovação do Premium!</p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">HoraMed Premium - Mais benefícios para você</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generatePlainTextEmail(data: RewardEmailData): string {
  return `
🎉 PARABÉNS! 🎉

Você desbloqueou uma nova conquista no HoraMed!

${data.rewardTitle}
${data.rewardDescription}

${data.streakDays ? `Sua série: ${data.streakDays} dias consecutivos` : ''}
${data.level ? `Nível: ${data.level}` : ''}

Continue assim! Cada dose tomada é um passo em direção à sua saúde.

Ver todas as conquistas: ${window.location.origin}/conquistas

---
HoraMed - Seu aliado na saúde
  `.trim();
}

export { BADGE_IMAGES };
