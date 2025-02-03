import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://yahwpojiggthmbxuqaku.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaHdwb2ppZ2d0aG1ieHVxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDk2OTgsImV4cCI6MjA1MzgyNTY5OH0.Ni9iO_jFXbzWTrxXxeudWJIyiJVO_LIjnhuDIehthCI";
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
      .single();

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
    await cadastrarUsuario(nome, contato, curso, codigoGrupo);

    let { data: grupo, error } = await supabase
      .from("grupos")
      .select("*")
      .eq("codigo", codigoGrupo)
      .single();

    if (!error && grupo) {
      let membros = Array.isArray(grupo.membros) ? grupo.membros.map(m => JSON.parse(m)) : [];
      if (!membros.some(m => m.contato === contato)) {
        membros.push({ nome, contato, curso });
        await supabase.from("grupos").update({ membros: membros.map(m => JSON.stringify(m)) }).eq("codigo", codigoGrupo);
      }
      grupo.membros = membros;
    } else if (error && error.code === "PGRST116") {
      grupo = { codigo: codigoGrupo, membros: [{ nome, contato, curso }], mensagens: [] };
      await supabase.from("grupos").insert({ codigo: codigoGrupo, membros: [JSON.stringify(grupo.membros[0])], mensagens: "[]" });
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
  membrosDiv.innerHTML = grupo.membros.length > 0 
    ? grupo.membros.map(m => `<p><strong>${m.nome} (${m.curso}):</strong> ${m.contato}</p>`).join("")
    : "<p>Ainda não há membros neste grupo.</p>";
}

async function carregarMensagens(grupo) {
  try {
    let { data: grupoAtualizado, error } = await supabase
      .from("grupos")
      .select("*")
      .eq("codigo", grupo.codigo)
      .single();

    if (error) throw error;
    mensagensDiv.innerHTML = grupoAtualizado.mensagens.length > 0 
      ? JSON.parse(grupoAtualizado.mensagens).map(msg => `<p><strong>${msg.nome}:</strong> ${msg.texto}</p>`).join("")
      : "<p>Ainda não há mensagens.</p>";
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
  }
}

async function enviarMensagem() {
  const mensagemTexto = mensagemInput.value.trim();
  const codigoGrupo = nomeSala.textContent.replace("Grupo: ", "");
  if (!mensagemTexto) return;

  try {
    let { data: grupo, error } = await supabase
      .from("grupos")
      .select("*")
      .eq("codigo", codigoGrupo)
      .single();

    if (error) throw error;

    let mensagens = grupo.mensagens ? JSON.parse(grupo.mensagens) : [];
    let usuario = grupo.membros.find(m => m.contato === document.getElementById("contato").value);
    mensagens.push({ nome: usuario ? usuario.nome : "Anônimo", texto: mensagemTexto });

    await supabase.from("grupos").update({ mensagens: JSON.stringify(mensagens) }).eq("codigo", codigoGrupo);
    carregarMensagens(grupo);
    mensagemInput.value = "";
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
  }
}
