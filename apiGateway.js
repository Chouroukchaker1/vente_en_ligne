const express = require('express'); // Framework Express
const bodyParser = require('body-parser'); // Pour traiter le JSON
const cors = require('cors'); // Pour autoriser les requêtes cross-origin
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
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

// Charger les fichiers proto
const clientProtoDefinition = protoLoader.loadSync('client.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const produitProtoDefinition = protoLoader.loadSync('produit.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const fournisseurProtoDefinition = protoLoader.loadSync('fournisseur.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Charger les définitions de service gRPC
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;
const fournisseurProto = grpc.loadPackageDefinition(fournisseurProtoDefinition).fournisseur;

// Créer les clients gRPC
const clientClient = new clientProto.ClientService('localhost:50051', grpc.credentials.createInsecure());
const produitClient = new produitProto.ProduitService('localhost:50052', grpc.credentials.createInsecure());
const fournisseurClient = new fournisseurProto.FournisseurService('localhost:50053', grpc.credentials.createInsecure());

// Endpoint pour obtenir un client par ID
app.get('/client/:id', async (req, res) => {
  const client_id = req.params.id;
  clientClient.GetClient({ client_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.client);
    }
  });
});

// Endpoint pour créer un client
app.post('/client', async (req, res) => {
  try {
    const { nom, email, password } = req.body;
    const nouveauClient = new Client({ nom, email, password });
    const client = await nouveauClient.save();
    await sendClientMessage('creation', { id: client._id, nom, email, password });
    res.json(client);
    clientClient.CreateClient({ nom, email, password }, (err, response) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  } catch (err) {
    res.status(500).send("Erreur lors de la création du client: " + err.message);
  }
});

// Endpoint pour supprimer un client
app.delete('/client/:id', async (req, res) => {
  const client_id = req.params.id;
  clientClient.DeleteClient({ client_id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: response.message });
    }
  });
});

// Endpoint pour obtenir un produit par ID
app.get('/produit/:id', async (req, res) => {
  const id = req.params.id;
  produitClient.GetProduit({ id }, (err, response) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(response.produit);
    }
  });
});

// Endpoint pour créer un produit
app.post('/produit', async (req, res) => {
  try {
    const { nom, description, qualite } = req.body;
    const nouveauProduit = new Produit({ nom, description, qualite });
    const produit = await nouveauProduit.save();
    await sendProduitMessage('creation', { id: produit._id, nom, description, qualite });
    res.json(produit);
    produitClient.CreateProduit({ nom, description, qualite }, (err, response) => {
      if (err) {
        res.status(500).send(err);
      }
    });
  } catch (err) {
    res.status(500).send("Erreur lors de la création du produit: " + err.message);
  }
});
    
    // Endpoint pour supprimer un produit
    app.delete('/produit/:id', async (req, res) => {
    const id = req.params.id;
    produitClient.DeleteProduit({ id }, (err, response) => {
    if (err) {
    res.status(500).send(err);
    } else {
    res.json({ message: response.message });
    }
    });
    });
    
    // Endpoint pour obtenir un fournisseur par ID
    app.get('/fournisseur/:id', async (req, res) => {
    const fournisseur_id = req.params.id;
    fournisseurClient.GetFournisseur({ fournisseur_id }, (err, response) => {
    if (err) {
    res.status(500).send(err);
    } else {
    res.json(response.fournisseur);
    }
    });
    });
    
    // Endpoint pour créer un fournisseur
    app.post('/fournisseur', async (req, res) => {
      try {
        const { nom, contact, adresse } = req.body;
        const nouveauFournisseur = new Fournisseur({ nom, contact, adresse });
        const fournisseur = await nouveauFournisseur.save();
        await sendFournisseurMessage('creation', { id: fournisseur._id, nom, contact, adresse });
        res.json(fournisseur);
        fournisseurClient.CreateFournisseur({ nom, contact, adresse }, (err, response) => {
          if (err) {
            res.status(500).send(err);
          }
        });
      } catch (err) {
        res.status(500).send("Erreur lors de la création du fournisseur: " + err.message);
      }
    });
    
    // Endpoint pour supprimer un fournisseur
    app.delete('/fournisseur/:id', async (req, res) => {
    const fournisseur_id = req.params.id;
    fournisseurClient.DeleteFournisseur({ fournisseur_id }, (err, response) => {
    if (err) {
    res.status(500).send(err);
    } else {
    res.json({ message: response.message });
    }
    });
    });
    
    // Démarrer le serveur Express
    const port = 3000;
app.listen(port, () => {
  console.log(`API Gateway opérationnel sur le port ${port}`);
});