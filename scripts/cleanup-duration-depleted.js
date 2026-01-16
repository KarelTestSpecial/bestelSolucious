// Data cleanup script to fix duration-depleted items
// This script will mark consumption records as completed when their duration has expired

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        const uncompletedConsumption = await prisma.consumption.findMany({
            where: {
                completed: false
            }
        });
        
        console.log(`Found ${uncompletedConsumption.length} uncompleted consumption records`);
        
        let updatedCount = 0;
        
        for (const consumption of uncompletedConsumption) {
            // Get delivery for this consumption
            let delivery = null;
            
            if (consumption.sourceType === 'delivery') {
                delivery = await prisma.delivery.findUnique({
                    where: { id: consumption.sourceId }
                });
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
                await prisma.consumption.update({
                    where: { id: consumption.id },
                    data: {
                        completed: true,
                        effDuration: estDuration
                    }
                });
                
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
        await prisma.$disconnect();
    }
}

// Run cleanup
cleanupDurationDepletedItems().catch(console.error);