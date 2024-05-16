//apiGateway.js
const express = require('express'); // Framework Express
const bodyParser = require('body-parser'); // Pour traiter le JSON
const cors = require('cors'); // Pour autoriser les requêtes cross-origin

const connectDB = require('./database'); // Connexion à MongoDB
const Fournisseur = require('./fournisseur'); // Modèle Fournisseur
const Produit = require('./produit'); // Modèle Produit
const Client = require('./client'); // Modèle Client
const { sendProduitMessage } = require('./ProduitProducer'); 
const { sendClientMessage } = require('./clientProducer'); // Importer la fonction d'envoi de message Kafka pour les clients
const { sendFournisseurMessage } = require('./FournisseurProducer'); // Importer la fonction d'envoi de message Kafka pour les fournisseurs



const app = express(); // Créer l'application Express

// Connexion à MongoDB
connectDB();

app.use(cors()); // Autoriser les requêtes cross-origin
app.use(bodyParser.json()); // Traiter le JSON



// Endpoints pour les fournisseurs
app.get('/fournisseur', async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.find(); // Obtenir tous les fournisseurs
    res.json(fournisseurs);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche des fournisseurs: " + err.message);
  }
});

app.get('/fournisseur/:id', async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findById(req.params.id); // Obtenir le fournisseur par ID
    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    res.json(fournisseur);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche du fournisseur: " + err.message);
  }
});


app.post('/fournisseur', async (req, res) => {
  try {
    const { nom, contact,adresse } = req.body;
    const nouveauFournisseur = new Fournisseur({ nom, contact,adresse });
    const fournisseur = await nouveauFournisseur.save();
    await sendFournisseurMessage('creation', { id: fournisseur._id, nom, contact,adresse });
    res.json(fournisseur);
  } catch (err) {
    res.status(500).send("Erreur lors de la création du fournisseur: " + err.message);
  }
});

app.delete('/fournisseur/:id', async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndDelete(req.params.id);
    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    await sendFournisseurMessage('suppression', { id: fournisseur._id });
    res.json({ message: "Fournisseur supprimé avec succès" });
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du fournisseur: " + err.message);
  }
});

app.put('/fournisseur/:id', async (req, res) => {
  try {
    const { nom, contact,adresse} = req.body;
    const updatedFournisseur = await Fournisseur.findByIdAndUpdate(
      req.params.id,
      { nom, contact,adresse },
      { new: true }
    );
    if (!updatedFournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    await sendFournisseurMessage('modification', { id: updatedFournisseur._id, contact,adresse });
    res.json(updatedFournisseur);
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du fournisseur: " + err.message);
  }
});

app.delete('/fournisseur/:id', async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndDelete(req.params.id);
    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    await sendFournisseurMessage('suppression', { id: fournisseur._id });
    res.json({ message: "Fournisseur supprimé avec succès" });
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du fournisseur: " + err.message);
  }
});

// Endpoint pour mettre à jour un fournisseur
app.put('/fournisseur/:id', async (req, res) => {
  try {
    const { nom, contact,adresse } = req.body;
    const updatedFournisseur = await Fournisseur.findByIdAndUpdate(
      req.params.id,
      { nom, contact,adresse },
      { new: true }
    );
    if (!updatedFournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    await sendFournisseurMessage('modification', { id: updatedFournisseur._id, nom, contact,adresse });
    res.json(updatedFournisseur);
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du fournisseur: " + err.message);
  }
});

// Endpoints pour les produits
app.get('/produit', async (req, res) => {
  try {
    const produits = await Produit.find(); // Obtenir tous les produits
    res.json(produits);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche des produits: " + err.message);
  }
});

app.get('/produit/:id', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id); // Obtenir le produit par ID
    if (!produit) {
      return res.status(404).send("Produit non trouvé");
    }
    res.json(produit);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche du produit: " + err.message);
  }
});

app.post('/produit', async (req, res) => {
  try {
    const { nom, description,prix } = req.body;
    const nouveauProduit = new Produit({ nom, description ,prix});
    const produit = await nouveauProduit.save(); // Sauvegarder le produit
    
    // Envoyer un message Kafka pour l'événement de création de produit
await sendProduitMessage('creation', { id: produit._id, nom, description,prix });
    res.json(produit); // Retourner le produit créé
  } catch (err) {
    res.status(500).send("Erreur lors de la création du produit: " + err.message);
  }
});


// Endpoint pour supprimer un produit
app.delete('/produit/:id', async (req, res) => {
  try {
    const produit = await Produit.findByIdAndDelete(req.params.id); // Supprimer le produit par ID
    if (!produit) {
      return res.status(404).send("Produit non trouvé");
    }
    //Envoyer un message Kafka pour l'événement de suppression de produit
await sendProduitMessage('suppression', { id: produit._id });
    res.json({ message: "Produit supprimé avec succès" });
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du produit: " + err.message);
  }
});
// Endpoint pour mettre à jour un produit
// Endpoint pour mettre à jour un produit
app.put('/produit/:id', async (req, res) => {
  try {
    const { nom, description,prix } = req.body;
    const updatedProduit = await Produit.findByIdAndUpdate(req.params.id, { nom, description ,prix}, { new: true });
    if (!updatedProduit) {
      return res.status(404).send("Produit non trouvé");
    }
    // Envoyer un message Kafka pour la modification du produit
    await sendProduitMessage('modification', { id: updatedProduit._id, nom, description,prix });
    res.json(updatedProduit);
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du produit: " + err.message);
  }
});



// Endpoints pour les clients
app.get('/client', async (req, res) => {
  try {
    const clients = await Client.find(); // Obtenir tous les clients
    res.json(clients);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche des clients: " + err.message);
  }
});

app.get('/client/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id); // Obtenir le client par ID
    if (!client) {
      return res.status(404).send("Client non trouvé");
    }
    res.json(client);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche du client: " + err.message);
  }
});

app.post('/client', async (req, res) => {
  try {
    const { nom, email,password} = req.body;
    const nouveauClient = new Client({ nom, email,password});
    const client = await nouveauClient.save(); // Sauvegarder le client
    
    // Envoyer un message Kafka pour l'événement de création de client
    await sendClientMessage('creation', { id: client._id, nom, email,password });

    res.json(client); // Retourner le client créé
  } catch (err) {
    res.status(500).send("Erreur lors de la création du client: " + err.message);
  }
});


// Endpoint pour supprimer un client
// Endpoint pour supprimer un client
// Endpoint pour supprimer un client
app.delete('/client/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id); // Supprimer le client par ID
    if (!client) {
      return res.status(404).send("Client non trouvé");
    }
    // Envoyer un message Kafka pour la suppression du produit
    await sendClientMessage('suppression', { id: client._id }); // <--- Correction ici
    res.json({ message: "Client supprimé avec succès" });
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du client: " + err.message);
  }
});


// Endpoint pour mettre à jour un client
// Endpoint pour mettre à jour un client
app.put('/client/:id', async (req, res) => {
  try {
    const { nom, email,password } = req.body;
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, { nom, email,password}, { new: true });
    if (!updatedClient) {
      return res.status(404).send("Client non trouvé");
    }
    // Envoyer un message Kafka pour la modification du produit
    await sendClientMessage('modification', { id: updatedClient._id, nom, email ,password});
    res.json(updatedClient);
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du client: " + err.message);
  }
});



// Démarrer le serveur Express
const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway opérationnel sur le port ${port}`); 
});
