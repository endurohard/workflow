import { Pool, PoolClient } from 'pg';
import ClientRepository from '../client.repository';
import { CreateClientData, UpdateClientData, ClientListQuery } from '../../models/client.model';
import { UserRole, UserStatus } from '../../models/user.model';

jest.mock('../../config/database');

describe('ClientRepository', () => {
  let clientRepository: ClientRepository;
  let mockQuery: jest.Mock;
  let mockGetClient: jest.Mock;
  let mockClient: Partial<PoolClient>;

  beforeEach(() => {
    mockQuery = jest.fn();
    mockGetClient = jest.fn();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    mockGetClient.mockResolvedValue(mockClient);

    const Database = require('../../config/database').default;
    Database.getInstance = jest.fn(() => ({
      query: mockQuery,
      getClient: mockGetClient,
    }));

    clientRepository = new ClientRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new client profile', async () => {
      const clientData: CreateClientData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        company_name: 'Acme Corp',
        company_registration: 'REG123456',
        tax_id: 'TAX789012',
        billing_address: '123 Main St',
        shipping_address: '456 Oak Ave',
        payment_terms: 'Net 30',
        credit_limit: 10000.00,
        notes: 'Important client',
      };

      const mockClient = {
        id: '456e7890-e89b-12d3-a456-426614174001',
        user_id: clientData.user_id,
        company_name: clientData.company_name,
        company_registration: clientData.company_registration,
        tax_id: clientData.tax_id,
        billing_address: clientData.billing_address,
        shipping_address: clientData.shipping_address,
        payment_terms: clientData.payment_terms,
        credit_limit: clientData.credit_limit,
        notes: clientData.notes,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockClient], rowCount: 1 });

      const result = await clientRepository.create(clientData);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO clients');
      expect(result).toEqual(mockClient);
    });

    it('should throw error if user_id already has client profile', async () => {
      const clientData: CreateClientData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
      };

      mockQuery.mockRejectedValue({ code: '23505' }); // Unique violation

      await expect(clientRepository.create(clientData)).rejects.toThrow();
    });

    it('should throw error if user_id does not exist', async () => {
      const clientData: CreateClientData = {
        user_id: 'non-existent-user-id',
      };

      mockQuery.mockRejectedValue({ code: '23503' }); // Foreign key violation

      await expect(clientRepository.create(clientData)).rejects.toThrow('User not found');
    });
  });

  describe('findById', () => {
    it('should return client with user details', async () => {
      const clientId = '456e7890-e89b-12d3-a456-426614174001';
      const mockResult = {
        id: clientId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        company_name: 'Acme Corp',
        company_registration: 'REG123456',
        tax_id: 'TAX789012',
        billing_address: '123 Main St',
        shipping_address: '456 Oak Ave',
        payment_terms: 'Net 30',
        credit_limit: 10000.00,
        notes: 'Important client',
        created_at: new Date(),
        updated_at: new Date(),
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'client@example.com',
          first_name: 'John',
          last_name: 'Client',
          phone: '+1234567890',
          role: UserRole.CLIENT,
          status: UserStatus.ACTIVE,
          profile_photo_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: null,
        },
      };

      mockQuery.mockResolvedValue({ rows: [mockResult], rowCount: 1 });

      const result = await clientRepository.findById(clientId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('JOIN users'),
        [clientId]
      );
      expect(result).toEqual(mockResult);
    });

    it('should return null if client not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await clientRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return client by user_id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = {
        id: '456e7890-e89b-12d3-a456-426614174001',
        user_id: userId,
        company_name: 'Acme Corp',
        company_registration: 'REG123456',
        tax_id: 'TAX789012',
        billing_address: '123 Main St',
        shipping_address: '456 Oak Ave',
        payment_terms: 'Net 30',
        credit_limit: 10000.00,
        notes: 'Important client',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockClient], rowCount: 1 });

      const result = await clientRepository.findByUserId(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [userId]
      );
      expect(result).toEqual(mockClient);
    });
  });

  describe('findAll', () => {
    it('should return paginated clients with default pagination', async () => {
      const mockClients = [
        {
          id: '456e7890-e89b-12d3-a456-426614174001',
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          company_name: 'Acme Corp',
          company_registration: 'REG123456',
          tax_id: 'TAX789012',
          billing_address: '123 Main St',
          shipping_address: '456 Oak Ave',
          payment_terms: 'Net 30',
          credit_limit: 10000.00,
          notes: 'Important client',
          created_at: new Date(),
          updated_at: new Date(),
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'client@example.com',
            first_name: 'John',
            last_name: 'Client',
            phone: null,
            role: UserRole.CLIENT,
            status: UserStatus.ACTIVE,
            profile_photo_url: null,
            created_at: new Date(),
            updated_at: new Date(),
            last_login_at: null,
          },
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockClients, rowCount: 1 });

      const query: ClientListQuery = {};
      const result = await clientRepository.findAll(query);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result.clients).toEqual(mockClients);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should search clients by company name or user details', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const query: ClientListQuery = { search: 'Acme' };
      await clientRepository.findAll(query);

      expect(mockQuery.mock.calls[0][0]).toContain('ILIKE');
    });

    it('should sort clients by specified field', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const query: ClientListQuery = { sortBy: 'company_name', sortOrder: 'asc' };
      await clientRepository.findAll(query);

      expect(mockQuery.mock.calls[1][0]).toContain('ORDER BY c.company_name ASC');
    });
  });

  describe('update', () => {
    it('should update client fields', async () => {
      const clientId = '456e7890-e89b-12d3-a456-426614174001';
      const updateData: UpdateClientData = {
        company_name: 'Acme Corporation Ltd',
        credit_limit: 15000.00,
        notes: 'Updated notes',
      };

      const mockUpdated = {
        id: clientId,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        company_name: 'Acme Corporation Ltd',
        company_registration: 'REG123456',
        tax_id: 'TAX789012',
        billing_address: '123 Main St',
        shipping_address: '456 Oak Ave',
        payment_terms: 'Net 30',
        credit_limit: 15000.00,
        notes: 'Updated notes',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [mockUpdated], rowCount: 1 });

      const result = await clientRepository.update(clientId, updateData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE clients SET'),
        expect.arrayContaining([clientId])
      );
      expect(result).toEqual(mockUpdated);
    });

    it('should return null if client not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await clientRepository.update('non-existent-id', { notes: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete client by id', async () => {
      const clientId = '456e7890-e89b-12d3-a456-426614174001';

      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await clientRepository.delete(clientId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM clients WHERE id = $1'),
        [clientId]
      );
      expect(result).toBe(true);
    });

    it('should return false if client not found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await clientRepository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });
});
