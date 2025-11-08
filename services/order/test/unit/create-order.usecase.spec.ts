import { CreateOrderUseCase } from '../../src/application/use-cases/create-order.usecase';
import { OrderRepository } from '../../src/infrastructure/repositories/order.repository';

describe('CreateOrderUseCase', () => {
  const mockRepo = {
    create: jest.fn(),
  } as unknown as OrderRepository;

  it('should call repository.create', async () => {
    mockRepo.create = jest.fn().mockResolvedValue({ userId: 'u1' });

    const usecase = new CreateOrderUseCase(mockRepo);

    const result = await usecase.execute({
      userId: 'u1',
      items: [{ productId: 'p1', quantity: 1 }],
      totalAmount: 200,
    });

    expect(mockRepo.create).toHaveBeenCalled();
    expect(result.userId).toBe('u1');
  });
});
