import { useState } from "react";
import { walletService } from "@/services/walletService";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

const PRESETS = [10000, 50000, 100000];

export function WalletDepositPage({ user }) {
  const [monto, setMonto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numericAmount = Number(monto);
    if (!monto || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await walletService.deposit({
        usuarioId: user.id,
        monto: numericAmount,
      });

      setMonto("");
      toast.add({
        type: "success",
        title: "Cargar",
        description: "Saldo acreditado.",
      });
    } catch (err) {
      const msg = err.message || "Error al acreditar saldo.";
      setError(msg);
      toast.add({
        type: "error",
        title: "Cargar",
        description: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreset = (value) => {
    setMonto(String(value));
    setError(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl mx-auto w-full">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <FieldGroup className="gap-4">
          <Field required data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="monto">
              Monto <span className="text-destructive">*</span>
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="monto"
                name="monto"
                type="number"
                min="1"
                step="1"
                value={monto}
                onChange={(e) => {
                  setMonto(e.target.value);
                  if (error) setError(null);
                }}
                disabled={submitting}
                placeholder="0"
                aria-invalid={Boolean(error)}
                required
              />
              <InputGroupAddon align="inline-start">
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>{error}</FieldError>
          </Field>

          {/* Presets rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((val) => (
              <Button
                key={val}
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => handlePreset(val)}
                className="h-8 text-xs font-normal"
              >
                +${val.toLocaleString("es-AR")}
              </Button>
            ))}
          </div>
        </FieldGroup>

        <div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto"
            size="lg"
          >
            {submitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Cargando...
              </>
            ) : (
              "Cargar"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
