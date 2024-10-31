const db = require('../config/db'); // Importa a conexão com o banco de dados


// Consulta SQL base para buscar agendamentos com detalhes de cliente e prestador
const queryBaseAgend = `
  SELECT 
    a.id as agendamento_id
    ,a.cliente_id
    ,b.nome as cliente_nome
    ,b.email as cliente_email
    ,b.telefone as cliente_telefone
    ,a.prestador_id
    ,d.nome as prestador_nome
    ,d.email as prestador_email
    ,d.telefone as prestador_telefone
    ,c.cpf_cnpj as prestador_cpf_cnpj
    ,c.atividade
    ,c.services
    ,c.instagram
    ,c.website
    ,a.data_agendamento
    ,a.hora_inicio
    ,a.hora_fim
    ,a.assunto
    ,a.status
    ,a.criado_em
    ,a.atualizado_em
  FROM 
    ${process.env.DB_SCHEMA}.agendamentos AS a
  INNER JOIN
    ${process.env.DB_SCHEMA}.usuarios AS b ON a.cliente_id = b.id
  INNER JOIN
    ${process.env.DB_SCHEMA}.prestadores AS c ON a.prestador_id = c.id
  INNER JOIN
    ${process.env.DB_SCHEMA}.usuarios AS d ON c.usuario_id = d.id
  `;

function formatAgendamento(row) {
  return {
    agendamento: {
      id: row.agendamento_id,
      data_agendamento: row.data_agendamento,
      hora_inicio: row.hora_inicio,
      hora_fim: row.hora_fim,
      assunto: row.assunto,
      status: row.status,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    },
    cliente: {
      id: row.cliente_id,
      nome: row.cliente_nome,
      email: row.cliente_email,
      telefone: row.cliente_telefone,
    },
    prestador: {
      id: row.prestador_id,
      nome: row.prestador_nome,
      email: row.prestador_email,
      telefone: row.prestador_telefone,
      cpf_cnpj: row.prestador_cpf_cnpj,
      atividade: row.atividade,
      services: row.services,
      instagram: row.instagram,
      website: row.website,
    }
  };
}


// Função para buscar agendamentos pelo ID do prestador
exports.getAgendByPrestId = async (req, res) => {
  const { prestador_id } = req.params;

  try {

    const queryWithParameter = `
      ${queryBaseAgend}
      WHERE
        a.prestador_id = $1;
      `;

    const values = [prestador_id];
    const { rows } = await db.query(queryWithParameter, values);

    const agendamentos = rows.map(formatAgendamento);

    res.status(200).json({
      message: 'Agendamentos obtidos com sucesso!',
      count: rows.length,
      agendamentos: agendamentos,
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    res.status(500).json({ message: 'Erro ao buscar agendamentos.', error: error.message });
  }
};

// Função para buscar um agendamento pelo ID
exports.getAgendById = async (req, res) => {
  const { agendamento_id } = req.params;

  try {

    const queryWithParameter = `
      ${queryBaseAgend}
      WHERE
        a.id = $1;
      `;

    const values = [agendamento_id];
    const { rows } = await db.query(queryWithParameter, values);

    const agendamento = rows.map(formatAgendamento);

    res.status(200).json({
      message: 'Agendamento obtido com sucesso!',
      count: rows.length,
      agendamentos: agendamento,
    });
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    res.status(500).json({ message: 'Erro ao buscar agendamento.', error: error.message });
  } 
};


// Função para buscar agendamentos pelo ID do prestador e um intervalo de tempo
exports.getAgendByPrestIdBetween = async (req, res) => {
  const { prestador_id, data_inicio, data_fim } = req.params;

  try {

    const queryWithParameter = `
      ${queryBaseAgend}
      WHERE
        a.prestador_id = $1
        and a.data_agendamento >= $2
        and a.data_agendamento <= $3
      ;
      `;

    const values = [prestador_id, data_inicio, data_fim];
    const { rows } = await db.query(queryWithParameter, values);

    const agendamentos = rows.map(formatAgendamento);

    res.status(200).json({
      message: 'Agendamentos obtidos com sucesso!',
      count: rows.length,
      agendamentos: agendamentos,
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    res.status(500).json({ message: 'Erro ao buscar agendamentos.', error: error.message });
  }
};

// Função para buscar agendamentos futuros por um ID do prestador
exports.getAgendFuturByPrestId = async (req, res) => {
  const { prestador_id } = req.params;

  try {

    const queryWithParameter = `
      ${queryBaseAgend}
      where
	      a.data_agendamento >= CURRENT_TIMESTAMP
        and  a.prestador_id = $1
      ;
      `;

    const values = [prestador_id];
    const { rows } = await db.query(queryWithParameter, values);

    const agendamentos = rows.map(formatAgendamento);

    res.status(200).json({
      message: 'Agendamentos obtidos com sucesso!',
      count: rows.length,
      agendamentos: agendamentos,
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    res.status(500).json({ message: 'Erro ao buscar agendamentos.', error: error.message });
  }
};


// Função para inserir um novo agendamento
exports.postAgendamento = async (req, res) => {
  const { cliente_id, prestador_id, data_agendamento, hora_inicio, hora_fim, assunto, status } = req.body;

  if (!cliente_id || !prestador_id || !data_agendamento || !hora_inicio || !hora_fim) {
    return res.status(400).json({ message: 'Os campos cliente_id, prestador_id, data_agendamento, hora_inicio e hora_fim são obrigatórios.' });
  }

  try {
   // Mapeamento de números para dias da semana em português
   const diasSemanaMap = {
    0: "domingo",
    1: "segunda",
    2: "terça",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sábado"
  };

  // Cria uma nova data e obtém o dia da semana
  const data = new Date(data_agendamento + 'T00:00:00-03:00'); // Ajustando para o fuso horário de Brasília
  const diaSemana = diasSemanaMap[data.getUTCDay()]; // Usando getUTCDay para corresponder ao fuso horário
    


    // Query para verificar o horário de atendimento do prestador para o dia da semana
    const queryCheckAvailability = `
      SELECT 
        b.dia_semana,
        b.hora_inicio,
        b.hora_fim
      FROM 
        ${process.env.DB_SCHEMA}.prestadores AS a
      INNER JOIN 
        ${process.env.DB_SCHEMA}.ritmo_trabalho AS b ON a.id = b.prestador_id
      WHERE 
        a.id = $1
        AND b.dia_semana = $2;
    `;

    const availabilityValues = [prestador_id, diaSemana];

    const { rows: availabilityRows } = await db.query(queryCheckAvailability, availabilityValues);

    // Verifica se encontrou disponibilidade para o dia da semana
    if (availabilityRows.length === 0) {
      return res.status(400).json({ message: 'O prestador não atende no dia selecionado.' });
    }

    const { hora_inicio: horarioInicio, hora_fim: horarioFim } = availabilityRows[0];

    // Converte os horários de atendimento para o formato HH:MM
    const convertToHHMM = (time) => {
      return time.slice(0, 5); // Pega apenas HH:MM dos horários no formato HH:MM:SS
    };

    // Converte os horários de atendimento
    const horarioInicioFormatado = convertToHHMM(horarioInicio);
    const horarioFimFormatado = convertToHHMM(horarioFim);

    if (hora_inicio < horarioInicioFormatado || hora_fim > horarioFimFormatado) {
      return res.status(400).json({ message: 'O horário do agendamento está fora do horário de atendimento do prestador.' });
    }    

    // Query de inserção do agendamento
    const queryInsert = `
      INSERT INTO ${process.env.DB_SCHEMA}.agendamentos 
        (cliente_id, prestador_id, data_agendamento, hora_inicio, hora_fim, assunto, status, criado_em, atualizado_em)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const insertValues = [cliente_id, prestador_id, data_agendamento, hora_inicio, hora_fim, assunto, status];
    const { rows } = await db.query(queryInsert, insertValues);

    // Formata o agendamento antes de retornar
    const agendamento = formatAgendamento(rows[0]);

    res.status(201).json({
      message: 'Agendamento inserido com sucesso!',
      agendamento: agendamento,
    });
  } catch (error) {
    console.error("Erro ao inserir agendamento:", error);
    res.status(500).json({ message: 'Erro ao inserir agendamento.', error: error.message });
  }
};

