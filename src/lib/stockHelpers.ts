import { auth, fetchCollection, fetchDocument, updateDocument, where, serverTimestamp } from "@/integrations/firebase";

/**
 * Decrement stock and recalculate projectedEndAt
 * Centralizes stock management logic to avoid duplication
 */
export async function decrementStockWithProjection(itemId: string): Promise<{
  success: boolean;
  newUnitsLeft?: number;
  projectedEndAt?: string;
}> {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false };

    const userId = user.uid;
    const stockPath = `users/${userId}/stock`;

    // Get current stock
    const { data: stockData, error: fetchError } = await fetchDocument<any>(stockPath, itemId);

    if (fetchError || !stockData) {
      console.log("[Stock] No stock found for item:", itemId);
      return { success: true }; // Not an error, just no stock tracking
    }

    if (stockData.currentQty <= 0) {
      console.log("[Stock] Stock already at 0 for item:", itemId);
      return { success: true, newUnitsLeft: 0 };
    }

    const newUnitsLeft = stockData.currentQty - 1;

    // Calculate new projected end date
    const projectedEndAt = await calculateProjectedEndAt(itemId, newUnitsLeft);

    // Update stock with both values
    const { error: updateError } = await updateDocument(stockPath, itemId, {
      currentQty: newUnitsLeft,
      projectedEndAt: projectedEndAt,
      updatedAt: serverTimestamp()
    });

    if (updateError) {
      console.error("[Stock] Error updating stock:", updateError);
      return { success: false };
    }

    return {
      success: true,
      newUnitsLeft,
      projectedEndAt: projectedEndAt || undefined
    };
  } catch (error) {
    console.error("[Stock] Error in decrementStockWithProjection:", error);
    return { success: false };
  }
}

/**
 * Calculate projected end date based on consumption rate
 */
async function calculateProjectedEndAt(itemId: string, unitsLeft: number): Promise<string | null> {
  if (unitsLeft <= 0) {
    return new Date().toISOString();
  }

  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userId = user.uid;

    // Get daily consumption from last 7 days from doses
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dosesPath = `users/${userId}/doses`;
    const { data: takenDoses } = await fetchCollection<any>(dosesPath, [
      where("itemId", "==", itemId),
      where("status", "==", "taken"),
      where("takenAt", ">=", sevenDaysAgo.toISOString())
    ]);

    let dailyConsumption = (takenDoses?.length || 0) / 7;

    // If no consumption history, estimate from schedules
    if (dailyConsumption === 0) {
      const schedulesPath = `users/${userId}/schedules`;
      const { data: schedules } = await fetchCollection<any>(schedulesPath, [
        where("itemId", "==", itemId),
        where("isActive", "==", true)
      ]);

      if (schedules) {
        dailyConsumption = schedules.reduce((acc, s) => {
          const times = s.times as string[] || [];
          return acc + times.length;
        }, 0);
      }

      if (dailyConsumption === 0) {
        dailyConsumption = 1; // Default to 1 dose per day
      }
    }

    const daysRemaining = unitsLeft / dailyConsumption;
    const projectedEnd = new Date();
    projectedEnd.setDate(projectedEnd.getDate() + daysRemaining);

    return projectedEnd.toISOString();
  } catch (error) {
    console.error("[Stock] Error calculating projected end:", error);
    return null;
  }
}

/**
 * Recalculate projectedEndAt for a stock item (call after manual stock updates)
 */
export async function recalculateStockProjection(itemId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const userId = user.uid;
  const stockPath = `users/${userId}/stock`;

  const { data: stockData } = await fetchDocument<any>(stockPath, itemId);

  if (!stockData) return;

  const projectedEndAt = await calculateProjectedEndAt(itemId, stockData.currentQty);

  await updateDocument(stockPath, itemId, { projectedEndAt: projectedEndAt });
}
