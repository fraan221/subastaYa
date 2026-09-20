import { useEffect, useState } from "react";
import { auctionService } from "@/services/auctionService";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ImageIcon } from "lucide-react";

const initialValues = {
  categoriaId: "",
  titulo: "",
  descripcion: "",
  urlImagen: "",
  precioBase: "",
  incrementoMinimo: "",
  fechaInicio: "",
  fechaFin: "",
};

function getLocalDateTimeValue(date = new Date()) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 16);
}

function getValidationErrors(values) {
  const errors = {};
  const startDate = values.fechaInicio ? new Date(values.fechaInicio) : null;
  const endDate = values.fechaFin ? new Date(values.fechaFin) : null;

  if (!values.categoriaId) {
    errors.categoriaId = "Seleccioná una categoría.";
  }

  if (!values.titulo.trim()) {
    errors.titulo = "El título es obligatorio.";
  } else if (values.titulo.length > 200) {
    errors.titulo = "El título no puede superar los 200 caracteres.";
  }

  if (!values.descripcion.trim()) {
    errors.descripcion = "La descripción es obligatoria.";
  } else if (values.descripcion.length > 1000) {
    errors.descripcion = "La descripción no puede superar los 1000 caracteres.";
  }

  if (!values.urlImagen.trim()) {
    errors.urlImagen = "La URL de la imagen es obligatoria.";
  } else if (values.urlImagen.length > 255) {
    errors.urlImagen = "La URL no puede superar los 255 caracteres.";
  }

  if (!values.precioBase || Number(values.precioBase) <= 0) {
    errors.precioBase = "El precio base debe ser mayor a cero.";
  }

  if (!values.incrementoMinimo || Number(values.incrementoMinimo) <= 0) {
    errors.incrementoMinimo = "El incremento mínimo debe ser mayor a cero.";
  }

  if (!startDate || Number.isNaN(startDate.getTime())) {
    errors.fechaInicio = "La fecha de inicio es obligatoria.";
  } else if (startDate <= new Date()) {
    errors.fechaInicio = "La fecha de inicio no puede estar en el pasado.";
  }

  if (!endDate || Number.isNaN(endDate.getTime())) {
    errors.fechaFin = "La fecha de finalización es obligatoria.";
  } else if (startDate && endDate <= startDate) {
    errors.fechaFin = "La fecha de finalización debe ser posterior al inicio.";
  }

  return errors;
}

function mapServerValidationErrors(data) {
  if (!data?.errors) return {};

  return Object.entries(data.errors).reduce((errors, [field, messages]) => {
    const fieldName = field.charAt(0).toLowerCase() + field.slice(1);
    errors[fieldName] = Array.isArray(messages)
      ? messages.join(" ")
      : String(messages);
    return errors;
  }, {});
}

export function AuctionForm({ user }) {
  const [values, setValues] = useState(initialValues);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    auctionService
      .getCategories()
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((error) => {
        if (active) {
          setCategoryError(error.message);
          toast.add({
            type: "error",
            title: "Categorías",
            description: "Error al cargar las categorías",
          });
        }
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
    setServerError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = getValidationErrors(values);
    setErrors(validationErrors);
    setServerError(null);

    if (Object.keys(validationErrors).length > 0) {
      toast.add({
        type: "warning",
        title: "Publicar subasta",
        description: "Revisá los campos obligatorios antes de continuar.",
      });
      return;
    }
    setSubmitting(true);

    try {
      await auctionService.create({
        vendedorId: Number(user.id),
        categoriaId: Number(values.categoriaId),
        titulo: values.titulo.trim(),
        descripcion: values.descripcion.trim(),
        urlImagen: values.urlImagen.trim(),
        precioBase: Number(values.precioBase),
        incrementoMinimo: Number(values.incrementoMinimo),
        fechaInicio: new Date(values.fechaInicio).toISOString(),
        fechaFin: new Date(values.fechaFin).toISOString(),
      });

      setValues(initialValues);
      toast.add({
        type: "success",
        title: "Publicar subasta",
        description: "Subasta creada y publicada exitosamente",
      });
    } catch (error) {
      const serverValidationErrors = mapServerValidationErrors(error.data);
      setErrors(serverValidationErrors);
      setServerError(
        Object.keys(serverValidationErrors).length > 0
          ? "Revisá los campos indicados."
          : error.message,
      );
      toast.add({
        type: "error",
        title: "Public subasta",
        description: "Error al crear la Subasta",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || categoriesLoading;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* Grupo 1: Título y Descripción */}
        <FieldGroup className="gap-5">
          <Field required data-invalid={Boolean(errors.titulo)}>
            <FieldLabel htmlFor="titulo">
              Título <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="titulo"
              name="titulo"
              value={values.titulo}
              onChange={handleChange}
              maxLength={200}
              disabled={disabled}
              aria-invalid={Boolean(errors.titulo)}
              required
            />
            <FieldError>{errors.titulo}</FieldError>
          </Field>

          <Field required data-invalid={Boolean(errors.descripcion)}>
            <FieldLabel htmlFor="descripcion">
              Descripción <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="descripcion"
              name="descripcion"
              className="min-h-28 resize-y"
              value={values.descripcion}
              onChange={handleChange}
              maxLength={1000}
              disabled={disabled}
              aria-invalid={Boolean(errors.descripcion)}
              required
            />
            <FieldError>{errors.descripcion}</FieldError>
          </Field>
        </FieldGroup>

        {/* Grupo 2: URL de imagen y Categoría */}
        <FieldGroup className="gap-5 md:grid md:grid-cols-2">
          <Field required data-invalid={Boolean(errors.urlImagen)}>
            <FieldLabel htmlFor="urlImagen">
              URL de imagen <span className="text-destructive">*</span>
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="urlImagen"
                name="urlImagen"
                type="url"
                value={values.urlImagen}
                onChange={handleChange}
                maxLength={255}
                disabled={disabled}
                aria-invalid={Boolean(errors.urlImagen)}
                required
              />
              <InputGroupAddon align="inline-start">
                <ImageIcon className="size-4" />
              </InputGroupAddon>
            </InputGroup>
            <FieldError>{errors.urlImagen}</FieldError>
          </Field>

          <Field required data-invalid={Boolean(errors.categoriaId)}>
            <FieldLabel htmlFor="categoriaId">
              Categoría <span className="text-destructive">*</span>
            </FieldLabel>
            <select
              id="categoriaId"
              name="categoriaId"
              className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
              value={values.categoriaId}
              onChange={handleChange}
              disabled={disabled}
              aria-invalid={Boolean(errors.categoriaId)}
              required
            >
              <option value="">
                {categoriesLoading
                  ? "Cargando categorías..."
                  : "Seleccionar categoría"}
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

        {/* Grupo 3: Precio base e Incremento mínimo */}
        <FieldGroup className="gap-5 md:grid md:grid-cols-2">
          <Field required data-invalid={Boolean(errors.precioBase)}>
            <FieldLabel htmlFor="precioBase">
              Precio base <span className="text-destructive">*</span>
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="precioBase"
                name="precioBase"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={values.precioBase}
                onChange={handleChange}
                disabled={disabled}
                aria-invalid={Boolean(errors.precioBase)}
                required
              />
              <InputGroupAddon align="inline-start">
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>{errors.precioBase}</FieldError>
          </Field>

          <Field required data-invalid={Boolean(errors.incrementoMinimo)}>
            <FieldLabel htmlFor="incrementoMinimo">
              Incremento mínimo <span className="text-destructive">*</span>
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="incrementoMinimo"
                name="incrementoMinimo"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={values.incrementoMinimo}
                onChange={handleChange}
                disabled={disabled}
                aria-invalid={Boolean(errors.incrementoMinimo)}
                required
              />
              <InputGroupAddon align="inline-start">
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>{errors.incrementoMinimo}</FieldError>
          </Field>
        </FieldGroup>

        {/* Grupo 4: Fecha inicio y Fecha fin */}
        <FieldGroup className="gap-5 md:grid md:grid-cols-2">
          <Field required data-invalid={Boolean(errors.fechaInicio)}>
            <FieldLabel htmlFor="fechaInicio">
              Fecha y hora de inicio <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="fechaInicio"
              name="fechaInicio"
              type="datetime-local"
              min={getLocalDateTimeValue()}
              value={values.fechaInicio}
              onChange={handleChange}
              disabled={disabled}
              aria-invalid={Boolean(errors.fechaInicio)}
              required
            />
            <FieldError>{errors.fechaInicio}</FieldError>
          </Field>

          <Field required data-invalid={Boolean(errors.fechaFin)}>
            <FieldLabel htmlFor="fechaFin">
              Fecha y hora de finalización{" "}
              <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="fechaFin"
              name="fechaFin"
              type="datetime-local"
              min={values.fechaInicio || getLocalDateTimeValue()}
              value={values.fechaFin}
              onChange={handleChange}
              disabled={disabled}
              aria-invalid={Boolean(errors.fechaFin)}
              required
            />
            <FieldError>{errors.fechaFin}</FieldError>
          </Field>
        </FieldGroup>

        {serverError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        <div>
          <Button
            type="submit"
            disabled={disabled}
            className="w-full sm:w-auto"
            size="lg"
          >
            {submitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Creando...
              </>
            ) : (
              "Publicar subasta"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
