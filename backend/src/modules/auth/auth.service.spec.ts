import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from './user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed-password'),
  compare: jest.fn(async () => true),
}));

describe('AuthService - profissionais', () => {
  let service: AuthService;
  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as any;
  const salonRepository = {} as any;
  const auditLog = jest.fn();
  const auditService = { log: auditLog } as unknown as AuditService;
  const jwtService = {} as unknown as JwtService;
  const configService = {
    get: jest.fn(() => undefined),
  } as unknown as ConfigService;

  const professionalBase: UserEntity = {
    id: 'prof-1',
    email: 'pro@example.com',
    password: 'old-hash',
    role: 'PROFESSIONAL',
    salonId: 'salon-1',
    fullName: 'Old Name',
    name: 'Old Name',
  } as UserEntity;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      userRepository,
      salonRepository,
      jwtService,
      auditService,
      configService,
    );
  });

  it('atualiza profissional do mesmo salão com novo nome e senha', async () => {
    userRepository.findOne.mockResolvedValueOnce({ ...professionalBase });
    userRepository.save.mockImplementation(async (p: UserEntity) => p);

    const result = await service.updateProfessional('salon-1', 'prof-1', {
      fullName: 'New Name',
      password: 'nova-senha-123',
    });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'prof-1', salonId: 'salon-1', role: 'PROFESSIONAL' as any },
    });
    expect(userRepository.save).toHaveBeenCalled();
    expect(result.fullName).toBe('New Name');
    expect(result.name).toBe('New Name');
    expect(result.role).toBe('PROFESSIONAL');
    expect(auditLog).toHaveBeenCalled();
    const lastLog = auditLog.mock.calls.at(-1)?.[0];
    expect(lastLog).toEqual(
      expect.objectContaining({
        action: 'UPDATE_PROFESSIONAL',
        salonId: 'salon-1',
      }),
    );
  });

  it('lança NotFound quando profissional não pertence ao salão', async () => {
    userRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      service.updateProfessional('salon-1', 'prof-1', { fullName: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('exclui profissional do salão', async () => {
    userRepository.findOne.mockResolvedValueOnce({ ...professionalBase });

    const result = await service.deleteProfessional('salon-1', 'prof-1');

    expect(userRepository.delete).toHaveBeenCalledWith('prof-1');
    expect(result).toEqual({ success: true });
    expect(auditLog).toHaveBeenCalled();
    const lastDeletionLog = auditLog.mock.calls.at(-1)?.[0];
    expect(lastDeletionLog).toEqual(
      expect.objectContaining({
        action: 'DELETE_PROFESSIONAL',
        salonId: 'salon-1',
      }),
    );
  });

  it('valida uniqueness de email ao atualizar', async () => {
    userRepository.findOne
      .mockResolvedValueOnce({ ...professionalBase })
      .mockResolvedValueOnce({ id: 'other', email: 'novo@example.com' });

    await expect(
      service.updateProfessional('salon-1', 'prof-1', {
        email: 'novo@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
