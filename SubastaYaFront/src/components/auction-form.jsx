import { useEffect, useState } from "react"
import { auctionService } from "@/services/auctionService"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const initialValues = {
  categoriaId: "",
  titulo: "",
  descripcion: "",
  urlImagen: "",
  precioBase: "",
  incrementoMinimo: "",
  fechaInicio: "",
  fechaFin: "",
}

function getLocalDateTimeValue(date = new Date()) {
  const localDate = new Date(date)
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset())
  return localDate.toISOString().slice(0, 16)
}

function getValidationErrors(values) {
  const errors = {}
  const startDate = values.fechaInicio ? new Date(values.fechaInicio) : null
  const endDate = values.fechaFin ? new Date(values.fechaFin) : null

  if (!values.categoriaId) {
    errors.categoriaId = "Seleccioná una categoría."
  }

  if (!values.titulo.trim()) {
    errors.titulo = "El título es obligatorio."
  } else if (values.titulo.length > 200) {
    errors.titulo = "El título no puede superar los 200 caracteres."
  }

  if (!values.descripcion.trim()) {
    errors.descripcion = "La descripción es obligatoria."
  } else if (values.descripcion.length > 1000) {
    errors.descripcion = "La descripción no puede superar los 1000 caracteres."
  }

  if (!values.urlImagen.trim()) {
    errors.urlImagen = "La URL de la imagen es obligatoria."
  } else if (values.urlImagen.length > 255) {
    errors.urlImagen = "La URL no puede superar los 255 caracteres."
  }

  if (!values.precioBase || Number(values.precioBase) <= 0) {
    errors.precioBase = "El precio base debe ser mayor a cero."
  }

  if (!values.incrementoMinimo || Number(values.incrementoMinimo) <= 0) {
    errors.incrementoMinimo = "El incremento mínimo debe ser mayor a cero."
  }

  if (!startDate || Number.isNaN(startDate.getTime())) {
    errors.fechaInicio = "La fecha de inicio es obligatoria."
  } else if (startDate <= new Date()) {
    errors.fechaInicio = "La fecha de inicio no puede estar en el pasado."
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    errors.fechaFin = "La fecha de finalización es obligatoria."
  } else if (startDate && endDate <= startDate) {
    errors.fechaFin = "La fecha de finalización debe ser posterior al inicio."
  }

  return errors
}

function mapServerValidationErrors(data) {
  if (!data?.errors) return {}

  return Object.entries(data.errors).reduce((errors, [field, messages]) => {
    const fieldName = field.charAt(0).toLowerCase() + field.slice(1)
    errors[fieldName] = Array.isArray(messages)
      ? messages.join(" ")
      : String(messages)
    return errors
  }, {})
}

export function AuctionForm({ user }) {
  const [values, setValues] = useState(initialValues)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryError, setCategoryError] = useState(null)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    auctionService.getCategories().then((data) => {
       if (active) setCategories(data)
      })
      .catch((error) => {
        if (active) setCategoryError(error.message)
      })
      .finally(() => {
        if (active) setCategoriesLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }))

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }))
    setServerError(null)
    setSuccess(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const validationErrors = getValidationErrors(values)
    setErrors(validationErrors)
    setServerError(null)
    setSuccess(null)

    if (Object.keys(validationErrors).length > 0) return
    //Evita crear una subasta vacia.
    setSubmitting(true)

    try {
      const auction = await auctionService.create({
        vendedorId: Number(user.id),
        categoriaId: Number(values.categoriaId),
        titulo: values.titulo.trim(),
        descripcion: values.descripcion.trim(),
        urlImagen: values.urlImagen.trim(),
        precioBase: Number(values.precioBase),
        incrementoMinimo: Number(values.incrementoMinimo),
        fechaInicio: new Date(values.fechaInicio).toISOString(),
        fechaFin: new Date(values.fechaFin).toISOString(),
      })

      setSuccess(`Subasta creada correctamente. ID: ${auction.id}.`)
      setValues(initialValues)
    } catch (error) {
      const serverValidationErrors = mapServerValidationErrors(error.data)
      setErrors(serverValidationErrors)
      setServerError(
        Object.keys(serverValidationErrors).length > 0
          ? "Revisá los campos indicados."
          : error.message
      )
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || categoriesLoading

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Publicar una subasta</CardTitle>
        <CardDescription>
          Completá los datos del producto, las condiciones económicas y el período de la subasta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <div>
              <h2 className="font-medium">Datos del producto</h2>
              <p className="text-sm text-muted-foreground">
                Información que verán los participantes.
              </p>
            </div>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="titulo">Título</FieldLabel>
                <Input
                  id="titulo"
                  name="titulo"
                  value={values.titulo}
                  onChange={handleChange}
                  maxLength={200}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.titulo)}
                  required
                />
                <FieldError>{errors.titulo}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="descripcion">Descripción</FieldLabel>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  value={values.descripcion}
                  onChange={handleChange}
                  maxLength={1000}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.descripcion)}
                  required
                />
                <FieldDescription>
                  Describí el estado, características y detalles relevantes del producto.
                </FieldDescription>
                <FieldError>{errors.descripcion}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="urlImagen">URL de imagen</FieldLabel>
                <Input
                  id="urlImagen"
                  name="urlImagen"
                  type="url"
                  value={values.urlImagen}
                  onChange={handleChange}
                  maxLength={255}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.urlImagen)}
                  required
                />
                <FieldError>{errors.urlImagen}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="categoriaId">Categoría</FieldLabel>
                <select
                  id="categoriaId"
                  name="categoriaId"
                   className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  value={values.categoriaId}
                  onChange={handleChange}
                  disabled={disabled}
                  aria-invalid={Boolean(errors.categoriaId)}
                  required
                >
                  <option value="">
                    {categoriesLoading ? "Cargando categorías..." : "Seleccionar categoría"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
                <FieldError>{errors.categoriaId || categoryError}</FieldError>
              </Field>
            </FieldGroup>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-medium">Configuración económica</h2>
              <p className="text-sm text-muted-foreground">
                Definí el punto de partida y el incremento mínimo de cada puja.
              </p>
            </div>
            <FieldGroup className="gap-5 md:grid md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="precioBase">Precio base inicial</FieldLabel>
                <Input
                  id="precioBase"
                  name="precioBase"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={values.precioBase}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.precioBase)}
                  required
                />
                <FieldError>{errors.precioBase}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="incrementoMinimo">Incremento mínimo</FieldLabel>
                <Input
                  id="incrementoMinimo"
                  name="incrementoMinimo"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={values.incrementoMinimo}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.incrementoMinimo)}
                  required
                />
                <FieldError>{errors.incrementoMinimo}</FieldError>
              </Field>
            </FieldGroup>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-medium">Ventana temporal</h2>
              <p className="text-sm text-muted-foreground">
                La fecha de finalización debe ser posterior al inicio.
              </p>
            </div>
            <FieldGroup className="gap-5 md:grid md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fechaInicio">Fecha y hora de inicio</FieldLabel>
                <Input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="datetime-local"
                  min={getLocalDateTimeValue()}
                  value={values.fechaInicio}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.fechaInicio)}
                  required
                />
                <FieldError>{errors.fechaInicio}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="fechaFin">Fecha y hora de finalización</FieldLabel>
                <Input
                  id="fechaFin"
                  name="fechaFin"
                  type="datetime-local"
                  min={values.fechaInicio || getLocalDateTimeValue()}
                  value={values.fechaFin}
                  onChange={handleChange}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.fechaFin)}
                  required
                />
                <FieldError>{errors.fechaFin}</FieldError>
              </Field>
            </FieldGroup>
          </section>

          {serverError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-md border border-green-600/30 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300"
            >
              {success}
            </div>
          )}

          <Button type="submit" disabled={disabled} className="w-full sm:w-auto">
            {submitting ? "Publicando..." : "Publicar subasta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
