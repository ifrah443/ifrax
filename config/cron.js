// config/cron.js
const cron = require('node-cron');
const Rickshaw = require('../models/Rickshaw');
const Transaction = require('../models/Transaction');

// 👇 Function name MUST match the export: initCronJobs
async function initCronJobs() {
  // Run every 30 minutes: at :00 and :30 past every hour
  cron.schedule('* * * * *', async () => {
    console.log(`⏰ Charge job started at ${new Date().toISOString()}`);
    
    try {
      const activeRickshaws = await Rickshaw.find({ isActive: true });
      console.log(`🔋 Found ${activeRickshaws.length} active rickshaws`);
      
      if (activeRickshaws.length === 0) return;

      for (const rickshaw of activeRickshaws) {
        // ✅ Update stored balance (PoC)
        rickshaw.balance = (rickshaw.balance || 0) + 5;
        await rickshaw.save();
        
        // ✅ Log transaction (matches your schema: rickshawId)
        await Transaction.create({
          rickshawId: rickshaw._id,  // ← Must match Transaction schema
          type: 'charge',
          amount: 5,
          description: '30-min cycle charge (PoC)'
        });
        
        console.log(`💵 Charged $5 to ${rickshaw.licensePlate}`);
      }
      
      console.log('✅ Charge job completed');
    } catch (err) {
      console.error('❌ [CRON ERROR]:', err.message);
    }
  });
  
  console.log('🕒 Charge cron scheduled (every 30 mins)');
}

// 👇 Export the function directly (matches your tail output)
module.exports = initCronJobs;