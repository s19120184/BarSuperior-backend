import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User } from 'src/auth/entities/user.entity';
import { Expense, PaymentMethod } from './entities/expense.entity';
import { Between, Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from 'src/catalogo-inventario/entities/categories.entity';
import { handleDBExceptions } from 'src/helpers/handleDBExceptions';
import { isUUID } from 'class-validator';
import { QueryBuilder } from 'typeorm/browser';
import { CashShift, ShiftStatus } from 'src/cash-register/entities/cash-shift.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(CashShift)
    private readonly cashShiftRepository: Repository<CashShift>, // 
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user: User) {
    const { categoryId, ...expenses } = createExpenseDto;

    //1.buscasr la categoria
    const category = await this.categoryRepository.findOneBy({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // 2. Normalizar paymentMethod para evitar discrepancias por minúsculas/mayúsculas
    // 2. Si no mandan paymentMethod, por defecto es CASH
    const selectedMethod: PaymentMethod =
      (createExpenseDto.paymentMethod as PaymentMethod) ||
      ((createExpenseDto as any).payment_method as PaymentMethod) ||
      PaymentMethod.CASH;


  // 3. Si el pago es en efectivo, asociar obligatoriamente al turno abierto
    let activeShift: CashShift | null = null;

    if (selectedMethod === PaymentMethod.CASH) {
      //tomamos el turno abierto mas reciente
      activeShift = await this.cashShiftRepository.findOne({
        where: { status: ShiftStatus.OPEN },
      });

      if (!activeShift) {
        throw new BadRequestException(
          'No se puede registrar un gasto en efectivo sin una caja/turno abierto.',
        );
      }
    }


    try {
      // 3. Instanciar y asignar explícitamente las relaciones
      const expense = this.expenseRepository.create({
        ...expenses,
        paymentMethod: selectedMethod,
        registeredBy: user,
        category,
      });

      // Asignar el turno explícitamente en la entidad
      if (activeShift) {
        expense.cashShift = activeShift;
      }

      const savedExpense = await this.expenseRepository.save(expense);

      return {
        expense:savedExpense
      };
    } catch (error) {
      handleDBExceptions(error, 'ExpenseService');
    }

    return 'This action adds a new expense';
  }

  findAll() {}

  async findByTerm(term: string) {
    let expense: Expense | null | Expense[];

    if (isUUID(term)) {
      expense = await this.expenseRepository.findOne({
        where: { id: term },
      });
      return expense;
    } else {
      expense = await this.expenseRepository.find({
        where: {
          supplier: term,
        },
      });

      return expense.map((exp) => exp);
    }
  }

  async findByDate(date: string) {
    try {
      const expense = await this.expenseRepository.find({
        where: {
          expenseDate: date,
        },
        //relations:{category:false, registeredBy:false}
      });

      console.log({ expense });

      if (!expense || expense.length === 0)
        throw new NotFoundException(`Expense not found`);

      return expense.map((exp) => exp);
    } catch (error) {
      handleDBExceptions(error, 'ExpenseService');
    }
  }

  // UPDATE
  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    const { categoryId, ...toUpdate } = updateExpenseDto;

    // 1. Cargar la entidad previa y fusionar cambios superficiales
    const expense = await this.expenseRepository.preload({
      id,
      ...toUpdate,
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }

    // 2. Si se mandó un nuevo categoryId, verificar que exista y asignarla
    if (categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id: categoryId,
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID "${categoryId}" not found`,
        );
      }
      expense.category = category;
    }

    try {
      // 3. Guardar cambios en la base de datos
      return await this.expenseRepository.save(expense);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      handleDBExceptions(error, 'ExpenseService');
    }
  }

  // Método auxiliar para buscar por ID o lanzar 404
  async findOne(id: string): Promise<Expense> {
    if (!isUUID(id)) {
      throw new BadRequestException(`El id ${id} no es un UUID válido`);
    }

    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: {
        category: true,
        registeredBy: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found`);
    }

    return expense;
  }

  async getSuppliers() {
    try {
      const suppliers = await this.expenseRepository
        .createQueryBuilder('expense')
        .select('DISTINCT expense.supplier', 'supplier')
        .where('expense.supplier IS NOT NULL')
        .andWhere("TRIM(expense.supplier) != ''")
        .orderBy('expense.supplier', 'ASC')
        .getRawMany();

      // getRawMany() devuelve un arreglo de objetos: [{ supplier: 'Amazon' }, { supplier: 'OfficeMax' }]
      // Mapeamos para retornar un simple arreglo de strings: ['Amazon', 'OfficeMax']
      return suppliers.map((item) => item.supplier);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      handleDBExceptions(error, 'ExpenseService');
    }
  }

  //soft delate
  async remove(id: string) {
    const expense = await this.findOne(id);

    try {
      //llena el deletedAt con la fecha acutal en lugar de borrar la fila
      await this.expenseRepository.softRemove(expense);

      return {
        message: `Expense with ID ${id}, soft-deleted successfully`,
      };
    } catch (error) {
      handleDBExceptions(error, 'ExpenseServise');
    }
  }

  //restore(recuperar gasto eliminado)
  async restore(id: string) {
    const result = await this.expenseRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException('Expense not found');
    }

    return {
      message: `Expense with ID ${id} restored successfully`,
    };
  }
}
