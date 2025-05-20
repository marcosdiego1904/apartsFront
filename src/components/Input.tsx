// src/components/Input.tsx

interface InputElements {
    label:string;
    type:string;
    value:string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // <-- ¡Cambiar a onChange!
    id?: string; // Añade esta prop si la usas en LoginPage
    // ... otras props ...
  }
  
  // También actualiza el nombre del parámetro en la destructuración
  export const Input = ({label,type,value,onChange, id}:InputElements) => {
    return (
      <>
        {/* Usa el ID para htmlFor para mejor accesibilidad */}
        {label && <label htmlFor={id}>{label}</label>} {/* Renderizar label solo si existe */}
        <input
          type={type}
          value={value}
          onChange={onChange} // <-- Pasando el prop onChange (camelCase)
          id={id} // Asigna el ID al input
        />
      </>
    )
  }