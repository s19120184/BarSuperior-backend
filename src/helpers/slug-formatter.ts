

export const formatSlug = (value:string):string =>{
     return value
      .toLowerCase()
      .trim()
      .replaceAll(' ', '_')
      .replaceAll("'", '')
      .replaceAll('/', '_'); // Opcional: limpiar caracteres que rompan URLs
}