//clientMicroservice
const grpc = require('@grpc/grpc-js'); // For gRPC
const protoLoader = require('@grpc/proto-loader'); // For loading Protobuf
const mongoose = require('mongoose'); // For MongoDB
const Client = require('./client'); // Mongoose model for clients
const { sendClientMessage } = require('./clientProducer'); // Kafka producer for clients

// Path to the Protobuf file
const clientProtoPath = './client.proto';

// Load the Protobuf
const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load the gRPC client service package
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/vente') // Use IPv4 to avoid issues
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process in case of error
  });

// gRPC service implementation for clients
const clientService = {
  getClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const client = await Client.findById(clientId);

      if (!client) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Client not found" });
      }

      callback(null, { client });
    } catch (err) {
      console.error("Error fetching client:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error fetching client" });
    }
  },

  searchClients: async (call, callback) => {
    try {
      const clients = await Client.find();
      callback(null, { clients });
    } catch (err) {
      console.error("Error searching clients:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error searching clients" });
    }
  },

  createClient: async (call, callback) => {
    try {
      const { nom,  email ,password} = call.request;
      const nouveauClient = new Client({ nom,  email ,password });
      const client = await nouveauClient.save();

      await sendClientMessage('creation', client);

      callback(null, { client });
    } catch (err) {
      console.error("Error creating client:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error creating client" });
    }
  },

  updateClient: async (call, callback) => {
    try {
      const { client_id, nom,  email,password } = call.request;
      const client = await Client.findByIdAndUpdate(
        client_id,
        { nom,  email ,password},
        { new: true } // Return the updated client
      );

      if (!client) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Client not found" });
      }

      await sendClientMessage('modification', client);

      callback(null, { client });
    } catch (err) {
      console.error("Error updating client:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error updating client: " + err.message });
    }
  },

  deleteClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const client = await Client.findByIdAndDelete(clientId);

      if (!client) {
        return callback({ code: grpc.status.NOT_FOUND, message: "Client not found" });
      }

      await sendClientMessage('suppression', client);

      callback(null, { message: "Client deleted successfully" });
    } catch (err) {
      console.error("Error deleting client:", err);
      callback({ code: grpc.status.INTERNAL, message: "Error deleting client: " + err.message });
    }
  },
};


// Create the gRPC server
const server = new grpc.Server();
server.addService(clientProto.ClientService.service, clientService);

server.bindAsync('0.0.0.0:50057', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Failed to bind server:", err);
    return;
  }
  server.start();
  console.log(`Client Service operational on port ${boundPort}`);
});
