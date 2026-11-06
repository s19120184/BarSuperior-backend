



export class DateFormatter{

    static formatter = new Intl.DateTimeFormat('es-Es',{
            year:'numeric',
            month:'long',
            day:'2-digit'
        })


    static getDDMMMMYYY(date:Date):string{

        
        return this.formatter.format(date)
    }

    
}

export const FechaActual=()=>{

    const hoy = new Date().toISOString().split('T')[0]// yyyy-mm-dd

    return hoy;
}