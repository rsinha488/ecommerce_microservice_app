import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderRepositoryInterface } from '../../domain/interfaces/order-repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderModel } from '../database/order.schema';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class OrderRepository implements OrderRepositoryInterface {
  constructor(
    @InjectModel('OrderModel') private readonly orderModel: Model<any>,
    private readonly mapper: OrderMapper,
  ) {}

  async create(order: Order): Promise<Order> {
    const doc = new this.orderModel(this.mapper.toPersistence(order));
    const saved = await doc.save();
    return this.mapper.toDomain(saved.toObject()) as Order;
  }

  async findById(id: string): Promise<Order | null> {
    const found = await this.orderModel.findOne({ orderId: id }).lean();
    return this.mapper.toDomain(found);
  }

  async findAll(filter: any = {}): Promise<Order[]> {
    const rows = await this.orderModel.find(filter).lean();
    return rows.map((r) => this.mapper.toDomain(r) as Order);
  }

  async updateStatus(id: string, status: string): Promise<Order | null> {
    const updated = await this.orderModel.findOneAndUpdate({ orderId: id }, { status }, { new: true }).lean();
    return this.mapper.toDomain(updated);
  }
}
