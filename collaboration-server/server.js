
require("dotenv").config();

const { Server } = require("@hocuspocus/server");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const server = new Server({
  port: Number(process.env.PORT || 1234),

  async onAuthenticate({ token, documentName }) {
    if (!token) {
      throw new Error("Authentication required");
    }

    const match = /^convergedesk-document-(\d+)$/.exec(documentName);

    if (!match) {
      throw new Error("Invalid document room");
    }

    const documentId = match[1];

    const response = await fetch(
      `${process.env.DJANGO_API_URL}/collaboration/documents/${documentId}/authorize/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
        const body = await response.text();

        console.error(
            "[onAuthenticate] Django rejected request:",
            response.status,
            body
        );

        throw new Error("Document access denied");
    }

    return { documentId };
  },

  async onLoadDocument({ documentName, document }) {
    const match = /^convergedesk-document-(\d+)$/.exec(documentName);
    if (!match) throw new Error("Invalid document room");

    const result = await pool.query(
      `SELECT state FROM core_collaborationstate WHERE document_id = $1`,
      [match[1]]
    );

    if (result.rows.length > 0 && result.rows[0].state) {
      const Y = require("yjs");
      Y.applyUpdate(document, new Uint8Array(result.rows[0].state));
    }
  },

  async onStoreDocument({ documentName, document }) {
    const match = /^convergedesk-document-(\d+)$/.exec(documentName);
    if (!match) throw new Error("Invalid document room");

    const Y = require("yjs");
    const state = Buffer.from(Y.encodeStateAsUpdate(document));

    await pool.query(
      `INSERT INTO core_collaborationstate (document_id, state, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (document_id)
       DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
      [match[1], state]
    );
  },
});

server.listen().then(() => {
  console.log(`ConvergeDesk collaboration server listening on port ${process.env.PORT || 1234}`);
});

process.on("SIGINT", async () => {
  await server.destroy();
  await pool.end();
  process.exit(0);
});
