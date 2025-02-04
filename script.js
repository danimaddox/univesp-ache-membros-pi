import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://yahwpojiggthmbxuqaku.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaHdwb2ppZ2d0aG1ieHVxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDk2OTgsImV4cCI6MjA1MzgyNTY5OH0.Ni9iO_jFXbzWTrxXxeudWJIyiJVO_LIjnhuDIehthCI";
const supabase = createClient(supabaseUrl, supabaseKey);

// Referências aos elementos da interface
const loginDiv = document.getElementById("login");
const salaDiv = document.getElementById("sala");
const nomeSala = document.getElementById("nomeSala");
const membrosDiv = document.getElementById("membros");
const mensagensDiv = document.getElementById("mensagens");
const mensagemInput = document.getElementById("mensagem");

document.getElementById("entrarNoGrupo").addEventListener("click", entrarNoGrupo);
document.getElementById("enviarMensagem").addEventListener("click", enviarMensagem);

async function cadastrarUsuario(nome, contato, curso, codigoGrupo) {
  try {
    let { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("contato", contato)
      .limit(1);;

    if (!usuario) {
      const { data, error } = await supabase
        .from("usuarios")
        .insert({ nome, contato, curso, codigo_grupo: codigoGrupo })
        .select();

      if (error) throw error;
      usuario = data[0];
    } else {
      const { error } = await supabase
        .from("usuarios")
        .update({ codigo_grupo: codigoGrupo, curso })
        .eq("contato", contato);
      if (error) throw error;
    }
    return usuario;
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
  }
}

async function entrarNoGrupo() {
  const nome = document.getElementById("nome").value.trim();
  const contato = document.getElementById("contato").value.trim();
  const curso = document.getElementById("curso").value.trim();
  const codigoGrupo = document.getElementById("codigoGrupo").value.trim();

  if (!nome || !contato || !curso || !codigoGrupo) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    const usuario = await cadastrarUsuario(nome, contato, curso, codigoGrupo);
    
    let { data: grupo, error } = await supabase
      .from("grupos")
      .select("*")
      .eq("codigo", codigoGrupo)
      .single();

    if (!error && grupo) {
      let membros = Array.isArray(grupo.membros)
        ? grupo.membros.map(m => (typeof m === "string" ? JSON.parse(m) : m))
        : JSON.parse(grupo.membros || "[]");

      const isMembro = membros.some(m => m.contato === contato);
      if (!isMembro) {
        membros.push({ nome, contato, curso });
        const membrosFormatados = membros.map(m => JSON.stringify(m));

        const { error } = await supabase
          .from("grupos")
          .update({ membros: membrosFormatados })
          .eq("codigo", codigoGrupo);
        if (error) throw error;
      }
      grupo.membros = membros;
    } else if (error && error.code === "PGRST116") {
      const novoGrupo = {
        codigo: codigoGrupo,
        membros: [JSON.stringify({ nome, contato, curso })],
        mensagens: "[]",
      };

      const { data, error } = await supabase.from("grupos").insert(novoGrupo);
      if (error) throw error;

      grupo = {
        codigo: novoGrupo.codigo,
        membros: [JSON.parse(novoGrupo.membros[0])],
        mensagens: [],
      };
    }

    loginDiv.style.display = "none";
    salaDiv.style.display = "block";
    nomeSala.textContent = `Grupo: ${codigoGrupo}`;

    carregarMembros(grupo);
    carregarMensagens(grupo);
  } catch (err) {
    console.error("Erro ao entrar no grupo:", err);
  }
}

function carregarMembros(grupo) {
  if (!grupo.membros || grupo.membros.length === 0) {
    membrosDiv.innerHTML = "<p>Ainda não há membros neste grupo.</p>";
    return;
  }

  let membros = grupo.membros.map(m => (typeof m === "string" ? JSON.parse(m) : m));
  membrosDiv.innerHTML = membros.map(m => `<p><strong>${m.nome} (${m.curso || "Sem curso"}):</strong> ${m.contato}</p>`).join("");
}

async function carregarMensagens(codigoGrupo) {
  try {
    let { data, error } = await supabase
      .from("grupos")
      .select("mensagens")
      .eq("codigo", codigoGrupo)
      .single();

    if (error) throw error;

    const mensagens = data?.mensagens || [];
    mensagensDiv.innerHTML = mensagens
      .map(msg => `<p><strong>${msg.nome}:</strong> ${msg.texto}</p>`)
      .join("");
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
  }
}

async function enviarMensagem() {
  const mensagemTexto = mensagemInput.value.trim();
  if (!mensagemTexto) return;

  const codigoGrupo = nomeSala.textContent.replace("Grupo: ", ""); // Obtém o código correto

  try {
    let { data: grupo, error } = await supabase
      .from("grupos")
      .select("mensagens")
      .eq("codigo", codigoGrupo)
      .single();
    
    if (error) throw error;

    let mensagens = grupo?.mensagens || [];
    mensagens.push({ nome: "Anônimo", texto: mensagemTexto });

    let { error: updateError } = await supabase
      .from("grupos")
      .update({ mensagens })
      .eq("codigo", codigoGrupo);

    if (updateError) throw updateError;

    carregarMensagens(codigoGrupo);
    mensagemInput.value = "";
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
  }
}


// Expor o Supabase no escopo global para debug
window.supabase = supabase;
