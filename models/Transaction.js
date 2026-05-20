// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  rickshawId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rickshaw', required: true },
  type: { type: String, enum: ['charge', 'payment'], required: true },
  amount: { type: Number, required: true },
  description: { type: String }, 
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);