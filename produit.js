//produit.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const produitSchema = new Schema({
  nom: {
    type: String,
    required: true, // Champs obligatoires
  },
  description: {
    type: String,
    required: true,
  },
  prix: {
    type: Number, // Assurez-vous que le type correspond à celui attendu pour le prix
    required: true
  }
});

const Produit = mongoose.model('Produit', produitSchema);

module.exports = Produit;
