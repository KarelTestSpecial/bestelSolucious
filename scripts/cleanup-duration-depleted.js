// Data cleanup script to fix duration-depleted items
// This script will mark consumption records as completed when their duration has expired

import Database from 'better-sqlite3';

const db = new Database('prisma/dev.db');

// Helper function to get week ID from absolute week (reverse of getAbsoluteWeek)
const getWeekIdFromAbs = (absWeek) => {
    const refDate = new Date(2020, 0, 6, 12, 0, 0, 0);
    const targetDate = new Date(refDate.getTime() + (absWeek * 7 * 24 * 60 * 60 * 1000));
    const year = targetDate.getFullYear();
    
    // Calculate ISO week number
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((targetDate - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
};

// Copy of getAbsoluteWeek function from utils
const getAbsoluteWeek = (weekId) => {
    const { year, week } = parseWeekId(weekId);
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dayOfWeek = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - (dayOfWeek || 7) + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - (dayOfWeek || 7));
    }
    ISOweekStart.setHours(12, 0, 0, 0);
    
    // Reference date: 2020-01-06 (a Monday)
    const refDate = new Date(2020, 0, 6, 12, 0, 0, 0);
    const diffMs = ISOweekStart.getTime() - refDate.getTime();
    return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
};

const parseWeekId = (weekId) => {
    const [year, week] = weekId.split('-W').map(Number);
    return { year, week };
};

async function cleanupDurationDepletedItems() {
    console.log('🧹 Starting data cleanup for duration-depleted items...');
    
    try {
        // Get current week
        const getCurrentWeekId = () => {
            const today = new Date();
            const year = today.getFullYear();
            const startOfYear = new Date(year, 0, 1);
            const days = Math.floor((today - startOfYear) / (24 * 60 * 60 * 1000));
            const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
            return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
        };
        
        const currentWeekId = getCurrentWeekId();
        const currentAbsWeek = getAbsoluteWeek(currentWeekId);
        
        console.log(`Current week: ${currentWeekId} (abs: ${currentAbsWeek})`);
        
        // Get all consumption records that are not completed
        const uncompletedConsumption = db.prepare('SELECT * FROM Consumption WHERE completed = 0').all();
        
        console.log(`Found ${uncompletedConsumption.length} uncompleted consumption records`);
        
        let updatedCount = 0;
        
        for (const consumption of uncompletedConsumption) {
            // Get delivery for this consumption
            let delivery = null;
            
            if (consumption.sourceType === 'delivery') {
                delivery = db.prepare('SELECT * FROM Delivery WHERE id = ?').get(consumption.sourceId);
            }
            
            if (!delivery) {
                console.log(`⚠️  No delivery found for consumption ${consumption.id}, skipping`);
                continue;
            }
            
            // Calculate depletion week
            const deliveryAbsWeek = getAbsoluteWeek(delivery.weekId);
            const estDuration = delivery.estDuration || 1;
            const depletionAbsWeek = deliveryAbsWeek + estDuration - 1;
            
            console.log(`📊 ${consumption.name}: delivery ${delivery.weekId} (${deliveryAbsWeek}), duration ${estDuration}, depletion week ${getWeekIdFromAbs(depletionAbsWeek)} (${depletionAbsWeek})`);
            
            // Check if current week is beyond depletion week
            if (currentAbsWeek > depletionAbsWeek) {
                console.log(`⏰ ${consumption.name} should be depleted - marking as completed`);
                
                // Mark as completed with effective duration
                db.prepare('UPDATE Consumption SET completed = 1, effDuration = ? WHERE id = ?')
                  .run(estDuration, consumption.id);
                
                updatedCount++;
                console.log(`✅ Updated ${consumption.name} to completed (duration: ${estDuration} weeks)`);
            } else {
                console.log(`📅 ${consumption.name} still active (${currentAbsWeek} <= ${depletionAbsWeek})`);
            }
        }
        
        console.log(`\n🎉 Cleanup completed! Updated ${updatedCount} records to completed status.`);
        
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        db.close();
    }
}

// Run cleanup
cleanupDurationDepletedItems().catch(console.error);
