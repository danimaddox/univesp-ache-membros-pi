document.addEventListener('DOMContentLoaded', function() {
  const supabaseUrl = "https://yahwpojiggthmbxuqaku.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaHdwb2ppZ2d0aG1ieXVxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDk2OTgsImV4cCI6MjA1MzgyNTY5OH0.Ni9iO_jFXbzWTrxXxeudWJIyiJVO_LIjnhuDIehthCI";
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

  async function obterOuCriarUsuario(nome, contato, curso, codigo_grupo) {
    try {
      let { data: usuario, error } = await supabase
        .from("users")
        .select("*")
        .eq("contato", contato)
        .single();

      if (error) {
        console.error("Erro ao buscar usuário:", error.message);
        throw error;
      }

      if (!usuario) {
        const { data, error } = await supabase
          .from("users")
          .insert([{ nome, contato, curso, codigo_grupo }])
          .select();

        if (error) {
          console.error("Erro ao inserir usuário:", error.message);
          throw error;
        }
        usuario = data[0];
      }

      return usuario;
    } catch (err) {
      console.error("Erro em obterOuCriarUsuario:", err.message);
      alert("Erro ao obter ou criar usuário: " + err.message);
      throw err;
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
      const usuario = await obterOuCriarUsuario(nome, contato, curso, codigoGrupo);

      let { data: grupo, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("codigo", codigoGrupo)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar grupo:", error.message);
        throw error;
      }

      if (!grupo) {
        const { error } = await supabase.from("grupos").insert([{
          codigo: codigoGrupo,
          membros: [usuario.id],
          mensagens: [],
        }]);
        if (error) throw error;

        grupo = { codigo: codigoGrupo, membros: [usuario.id], mensagens: [] };
      } else {
        if (grupo.membros.includes(usuario.id)) {
          alert("Você já faz parte deste grupo!");
          return;
        }

        const { error } = await supabase
          .from("grupos")
          .update({ membros: [...grupo.membros, usuario.id] })
          .eq("codigo", codigoGrupo);
        if (error) throw error;

        grupo.membros.push(usuario.id);
      }

      loginDiv.style.display = "none";
      salaDiv.style.display = "block";
      nomeSala.textContent = `Grupo: ${codigoGrupo}`;

      carregarMembros(grupo);
      carregarMensagens(grupo);
    } catch (err) {
      console.error("Erro em entrarNoGrupo:", err.message);
      alert("Erro ao entrar no grupo: " + err.message);
    }
  }

  async function carregarMembros(grupo) {
    try {
      const { data: usuarios, error } = await supabase
        .from("users")
        .select("*")
        .in("id", grupo.membros)
        .eq("codigo_grupo", grupo.codigo);

      if (error) {
        console.error("Erro ao carregar membros:", error.message);
        membrosDiv.innerHTML = "<p>Erro ao carregar membros.</p>";
        return;
      }

      membrosDiv.innerHTML = usuarios.map(usuario => `<p><strong>${usuario.nome} (${usuario.curso || "Sem curso"}):</strong> ${usuario.contato} (Grupo: ${usuario.codigo_grupo})</p>`).join("");
    } catch (err) {
      console.error("Erro ao carregar membros:", err.message);
      membrosDiv.innerHTML = "<p>Erro ao carregar membros.</p>";
    }
  }

  async function carregarMensagens(grupo) {
    try {
      const { data: grupoAtualizado, error } = await supabase
        .from("grupos")
        .select("mensagens")
        .eq("codigo", grupo.codigo)
        .single();

      if (error) {
        console.error("Erro ao buscar mensagens:", error.message);
        throw error;
      }

      const mensagens = grupoAtualizado?.mensagens || [];

      if (mensagens.length === 0) {
        mensagensDiv.innerHTML = "<p>Ainda não há mensagens neste grupo.</p>";
        return;
      }

      mensagensDiv.innerHTML = mensagens.map(msg => `<p><strong>${msg.nome}:</strong> ${msg.texto}</p>`).join("");
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err.message);
    }
  }

  async function enviarMensagem() {
    const mensagemTexto = mensagemInput.value.trim();
    const codigoGrupo = nomeSala.textContent.replace("Grupo: ", "");
    const contato = document.getElementById("contato").value;

    if (!mensagemTexto || !contato) return;

    try {
      const { data: usuario, error: usuarioError } = await supabase
        .from("users")
        .select("nome")
        .eq("contato", contato)
        .single();

      if (usuarioError) {
        console.error("Erro ao buscar nome do usuário:", usuarioError.message);
        throw usuarioError;
      }

      const nomeUsuario = usuario ? usuario.nome : "Anônimo";

      let { data: grupo, error } = await supabase
        .from("grupos")
        .select("mensagens")
        .eq("codigo", codigoGrupo)
        .single();

      if (error) {
        console.error("Erro ao buscar grupo:", error.message);
        throw error;
      }

      const mensagens = grupo?.mensagens || [];

      mensagens.push({ nome: nomeUsuario, texto: mensagemTexto });

      const { error: updateError } = await supabase
        .from("grupos")
        .update({ mensagens })
        .eq("codigo", codigoGrupo);

      if (updateError) {
        console.error("Erro ao enviar mensagem:", updateError.message);
        throw updateError;
      }

      carregarMensagens(grupo);
      mensagemInput.value = "";
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err.message);
      alert("Ocorreu um erro ao enviar a mensagem. Verifique o console para mais detalhes.");
    }
  }

  window.supabase = supabase;
});
