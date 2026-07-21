import { useState, type ChangeEvent, type FormEvent } from "react";
import { createCustomer } from "../api";
import ResultBox, { type ResultState } from "./ResultBox";
import { SEED_CUSTOMERS } from "../seedData";

interface Props {
  onCustomerCreated: (customerId: string) => void;
}

export default function CreateCustomerForm({ onCustomerCreated }: Props) {
  const [customerId, setCustomerId] = useState("d215b5f8-0249-4dc5-89a3-51fd148cfb41");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [result, setResult] = useState<ResultState | null>(null);

  function handleGenerateUuid() {
    setCustomerId(crypto.randomUUID());
  }

  function handlePickSeed(event: ChangeEvent<HTMLSelectElement>) {
    if (event.target.value) setCustomerId(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await createCustomer({ customerId, username, firstName, lastName });
      setResult({ kind: "success", title: "Cliente creado.", data: response });
      onCustomerCreated(response.customerId);
    } catch (error) {
      setResult({ kind: "error", title: error instanceof Error ? error.message : "Error desconocido." });
    }
  }

  return (
    <section className="card">
      <h2>1. Crear cliente</h2>
      <p className="panel-desc">
        <code>POST /customers</code>
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          customerId (UUID)
          <div className="input-with-button">
            <input
              name="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            />
            <button type="button" data-generate-uuid="customerId" onClick={handleGenerateUuid}>
              Generar
            </button>
          </div>
        </label>
        <label>
          Usar cliente de prueba (init-data.sql)
          <select value="" onChange={handlePickSeed}>
            <option value="">— elegir —</option>
            {SEED_CUSTOMERS.map((customer) => (
              <option key={customer.customerId} value={customer.customerId}>
                {customer.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Usuario
          <input
            name="username"
            placeholder="user_1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Nombre
          <input
            name="firstName"
            placeholder="First"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
        <label>
          Apellido
          <input
            name="lastName"
            placeholder="User"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </label>
        <button type="submit">Crear cliente</button>
      </form>
      <ResultBox result={result} />
    </section>
  );
}
