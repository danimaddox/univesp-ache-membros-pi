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
const contatoInput = document.getElementById("contato");

document.getElementById("entrarNoGrupo").addEventListener("click", entrarNoGrupo);
document.getElementById("enviarMensagem").addEventListener("click", enviarMensagem);

async function cadastrarUsuario(nome, contato, curso, codigoGrupo) {
  try {
    let { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("contato", contato)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    if (!usuario) {
      let { data, error } = await supabase
        .from("usuarios")
        .insert({ nome, contato, curso, codigo_grupo: codigoGrupo })
        .select();

      if (error) throw error;
      usuario = data[0];
    } else {
      let { error } = await supabase
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
  const contato = contatoInput.value.trim();
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

    if (!grupo) {
      const { error } = await supabase.from("grupos").insert({
        codigo: codigoGrupo,
        membros: JSON.stringify([{ nome, contato, curso }]),
        mensagens: "[]"
      });
      if (error) throw error;
      grupo = { codigo: codigoGrupo, membros: [{ nome, contato, curso }], mensagens: [] };
    } else {
      let membros = JSON.parse(grupo.membros || "[]");
      if (!membros.some(m => m.contato === contato)) {
        membros.push({ nome, contato, curso });
        await supabase.from("grupos").update({ membros: JSON.stringify(membros) }).eq("codigo", codigoGrupo);
      }
      grupo.membros = membros;
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
  const membros = JSON.parse(grupo.membros || "[]");
  membrosDiv.innerHTML = membros
    .map(membro => `<p><strong>${membro.nome} (${membro.curso || "Sem curso"}):</strong> ${membro.contato}</p>`)
    .join("");
}

async function carregarMensagens(grupo) {
  try {
    let { data: grupoAtualizado, error } = await supabase
      .from("grupos")
      .select("*")
      .eq("codigo", grupo.codigo)
      .single();

    if (error) throw error;

    const mensagens = JSON.parse(grupoAtualizado.mensagens || "[]");
    mensagensDiv.innerHTML = mensagens
      .map(msg => `<p><strong>${msg.nome}:</strong> ${msg.texto}</p>`)
      .join("");
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
  }
}

async function enviarMensagem() {
  const mensagemTexto = mensagemInput.value.trim();
  const codigoGrupo = nomeSala.textContent.replace("Grupo: ", "");
  const contato = contatoInput.value.trim();

  if (!mensagemTexto) return;

  try {
    let { data: grupo, error } = await supabase
      .from("grupos")
      .select("*")
      .eq("codigo", codigoGrupo)
      .single();

    if (error) throw error;

    let membros = JSON.parse(grupo.membros || "[]");
    let usuario = membros.find(m => m.contato === contato);
    let nomeUsuario = usuario ? usuario.nome : "Anônimo";

    let mensagens = JSON.parse(grupo.mensagens || "[]");
    mensagens.push({ nome: nomeUsuario, texto: mensagemTexto });

    await supabase
      .from("grupos")
      .update({ mensagens: JSON.stringify(mensagens) })
      .eq("codigo", codigoGrupo);

    carregarMensagens(grupo);
    mensagemInput.value = "";
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
  }
}
