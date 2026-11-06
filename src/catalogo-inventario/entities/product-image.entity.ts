import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./products.entity";



@Entity({name:'products_images'})
export class ProductImage{


    @PrimaryGeneratedColumn()
    id!:number;


    @Column('text')
    url!:string;

    //muchas imagenes pueden tener un producto
    @ManyToOne(
        ()=>Product,
        (product) => product.images,
        {onDelete:'CASCADE'}//para elimnar en cascada 
    )
    product!:Product

}