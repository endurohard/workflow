import { Request, Response } from 'express';
import ClientRepository from '../repositories/client.repository';
import RedisClient from '../config/redis';
import { CreateClientData, UpdateClientData, ClientListQuery } from '../models/client.model';

class ClientController {
  private clientRepository: ClientRepository;
  private redisClient: RedisClient;
  private readonly CACHE_TTL = 3600;

  constructor() {
    this.clientRepository = new ClientRepository();
    this.redisClient = RedisClient.getInstance();
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const clientData: CreateClientData = req.body;
      const client = await this.clientRepository.create(clientData);

      res.status(201).json({
        message: 'Client profile created successfully',
        client,
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create client profile' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const cacheKey = `client:${id}`;
      const cached = await this.redisClient.get(cacheKey);

      if (cached) {
        res.json({ client: JSON.parse(cached) });
        return;
      }

      const client = await this.clientRepository.findById(id);

      if (!client) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      await this.redisClient.set(cacheKey, JSON.stringify(client), this.CACHE_TTL);

      res.json({ client });
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({ error: 'Failed to fetch client' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const query: ClientListQuery = req.query;
      const result = await this.clientRepository.findAll(query);

      res.json({
        clients: result.clients,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateClientData = req.body;

      const updated = await this.clientRepository.update(id, updateData);

      if (!updated) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      await this.redisClient.delete(`client:${id}`);

      res.json({
        message: 'Client updated successfully',
        client: updated,
      });
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ error: 'Failed to update client' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deleted = await this.clientRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Client not found' });
        return;
      }

      await this.redisClient.delete(`client:${id}`);

      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Error deleting client:', error);
      res.status(500).json({ error: 'Failed to delete client' });
    }
  };
}

export default ClientController;
