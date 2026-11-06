import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './categories.entity';
import { ProductImage } from './product-image.entity';
import { User } from 'src/auth/entities/user.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { unique: true })
  title!: string;

  @Column('float', { default: 0 })
  price!: number;

  @Column('text', { unique: true })
  slug!: string;

  @Column('text', { array: true })
  sizes!: string[];

  @Column('bool', { default: false })
  is_prepared!:boolean

  @Column('bool', { default: true })
  is_active!:boolean

  @Column('int', {default:0})
  stock!: number



  //relacion muchos a uno(muchos productos relacion con una categoria)
  @ManyToOne(()=> Category, (catetory)=> catetory.product)
  category!:Category

  //un producto puede tener muchas imagenes
  @OneToMany(()=> ProductImage, (producImage)=> producImage.product)
  images!:ProductImage[]

  // muuchos productos estan relacionados a un usuario
  @ManyToOne(()=> User , (user)=>  user.product, {eager:true})
  user!:User


  //antes de ejecutarse el create si ejecuta esta funcion utilizando beforeInsert
  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .trim()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }


  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug 
      
    this.slug = this.formatSlug(this.slug)
  }

  private formatSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replaceAll(' ', '_')
      .replaceAll("'", '')
      .replaceAll('/', '_'); // Opcional: limpiar caracteres que rompan URLs
  }
}
