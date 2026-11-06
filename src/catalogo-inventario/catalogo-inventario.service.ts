import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/products.entity';
import { Category } from './entities/categories.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { handleDBExceptions } from 'src/helpers/handleDBExceptions';

@Injectable()
export class CatalogoInventarioService {
  constructor(
    @InjectRepository(Product)
    private readonly poductRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  async createCategory(createCategorydto: CreateCategoryDto) {
    console.log(createCategorydto);
    try {
      const category = this.categoryRepository.create(createCategorydto);

    
      await this.categoryRepository.save(category);

      return category;
    } catch (error) {
      handleDBExceptions(error, 'categoryService');
    }
  }

  async getAllCategory() {
    try {
      const categorys = await this.categoryRepository.find();

      return categorys;
    } catch (error) {
      handleDBExceptions(error, 'CategoryService');
    }
  }

  private async findOneCategory(id: string) {
    try {
      const categoryExist = await this.categoryRepository.findOne({
        where: {
          id: id,
        },
      });

      
      return categoryExist;

    } catch (error) {
      handleDBExceptions(error, 'CategoryService');
    }
  }

  async updateCategory(id: string, updatedCategoryDto: UpdateCategoryDto) {
    const { title, description, type} = updatedCategoryDto;


    const categoryExist = await this.findOneCategory(id);

    if (!categoryExist) {
      throw new NotFoundException(`Categoria con id ${id} no encotrada`);
    }

    categoryExist.title = title ? title : categoryExist.title;
    categoryExist.description = description
      ? description
      : categoryExist.description;

    categoryExist.type = type ? type : categoryExist.type

    await this.categoryRepository.save(categoryExist);

    return categoryExist;
  }

  async deleteCategory(id: string) {
    
    const exist = await this.findOneCategory(id);

    this.notFound(exist,id, 'Categoria')

    await this.categoryRepository.delete(id);
    
    return {
      msg: 'Categoria eliminada',
    };
  }

  private notFound (any: any, id:string, name:string){
      
    if (!any) {
      throw new NotFoundException(`${name} con id ${id} no encotrada`);
    }
  }

  //productos

  
}
