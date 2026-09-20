const newman = require('newman');
const collection = require('./SubastaYa_Stress_Test.postman_collection.json');

const BASE_URL = process.env.API_URL || 'http://localhost:5080';
const SUBASTA_ID = process.env.SUBASTA_ID || '1';

function ejecutarInstancia(nombre, envVars) {
    return new Promise((resolve) => {
        let status = null, body = null;
        newman.run({ collection, folder: 'Concurrencia', envVar: envVars, reporters: [] })
            .on('request', (_, args) => {
                if (args?.response) {
                    status = args.response.code;
                    try {
                        body = JSON.parse(args.response.stream.toString());
                    } catch {
                        body = args.response.stream.toString();
                    }
                }
            })
            .on('done', () => resolve({ nombre, status, body }));
    });
}

async function main() {
    const prev = await (await fetch(`${BASE_URL}/api/auctions/${SUBASTA_ID}`)).json();
    const compradorId = prev.ultimaPujaComprador === 'Comprador1' ? 3 : 2;
    const monto = (prev.montoActual || prev.precioBase) + prev.incrementoMinimo;

    console.log(`[Stress Test] Subasta ${SUBASTA_ID} (v${prev.version}) - Disparando 2 peticiones concurrentes por $${monto}...`);

    const envVars = [
        { key: 'baseUrl', value: BASE_URL },
        { key: 'subastaId', value: String(SUBASTA_ID) },
        { key: 'compradorId', value: String(compradorId) },
        { key: 'monto', value: String(monto) }
    ];

    const [req1, req2] = await Promise.all([
        ejecutarInstancia('Petición 1', envVars),
        ejecutarInstancia('Petición 2', envVars)
    ]);

    const formatResp = (r) => r.status === 201 
        ? `Aceptada (Puja ID: ${r.body.pujaId}, Monto: $${r.body.monto})`
        : `Rechazada (${r.body.mensaje || JSON.stringify(r.body)})`;

    console.log(`  -> ${req1.nombre}: HTTP ${req1.status} - ${formatResp(req1)}`);
    console.log(`  -> ${req2.nombre}: HTTP ${req2.status} - ${formatResp(req2)}`);

    const post = await (await fetch(`${BASE_URL}/api/auctions/${SUBASTA_ID}`)).json();
    console.log(`[Consistencia] Versión: ${prev.version} -> ${post.version} | Monto líder: $${post.montoActual} (${post.ultimaPujaComprador})`);

    const codigos = [req1.status, req2.status].sort();
    const exito = codigos[0] === 201 && codigos[1] === 409 && (post.version - prev.version === 1);

    console.log(`[Resultado] ${exito ? 'OK: Concurrencia Optimista Verificada (201 vs 409)' : 'ERROR'}\n`);
    process.exit(exito ? 0 : 1);
}

main().catch(console.error);
