document.addEventListener('DOMContentLoaded', function() {
  window.addEventListener('load', function() {
    const supabaseUrl = "https://yahwpojiggthmbxuqaku.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhaHdwb2ppZ2d0aG1ieHVxYWt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDk2OTgsImV4cCI6MjA1MzgyNTY5OH0.Ni9iO_jFXbzWTrxXxeudWJIyiJVO_LIjnhuDIehthCI";

    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // Referências aos elementos da interface
    const loginDiv = document.getElementById("login");
    const salaDiv = document.getElementById("sala");
    const nomeSala = document.getElementById("nomeSala");
    const membrosDiv = document.getElementById("membros");
    const mensagensDiv = document.getElementById("mensagens");
    const mensagemInput = document.getElementById("mensagem");

    document.getElementById("entrarNoGrupo").addEventListener("click", entrarNoGrupo);
    document.getElementById("enviarMensagem").addEventListener("click", enviarMensagem);

    async function obterOuCriarUsuario(nome, contato, curso, codigo) {
      try {
        let { data: usuario, error } = await supabaseClient
          .from("users")
          .select("*")
          .eq("contato", contato)
          .single();

        if (error) {
          console.error("Erro ao buscar usuário:", error.message);
          throw error;
        }

        if (!usuario) {
          const { data, error } = await supabaseClient
            .from("users")
            .insert([{ nome, contato, curso, codigo }])
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
      const grupo = document.getElementById("codigoGrupo").value.trim();

      if (!nome || !contato || !curso || !codigoGrupo) {
        alert("Preencha todos os campos!");
        return;
      }

      try {
        const usuario = await obterOuCriarUsuario(nome, contato, curso, codigoGrupo);

        let { data: grupo, error } = await supabaseClient
          .from("users")
          .select("*")
          .eq("codigo", codigoGrupo) // Usando a nova coluna codigo
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao buscar grupo:", error.message);
          throw error;
        }

        if (!grupo) {
          const { error } = await supabaseClient
            .from("users")
            .insert([{
              codigo: codigoGrupo,
              codigo: codigoGrupo, // Adiciona codigo ao inserir
              membros: [usuario.id],
              mensagens: [],
            }]);
          if (error) throw error;

          grupo = { codigo: codigoGrupo, codigo: codigoGrupo, membros: [usuario.id], mensagens: [] };
        } else {
          if (grupo.membros.includes(usuario.id)) {
            alert("Você já faz parte deste grupo!");
            return;
          }

          const { error } = await supabaseClient
            .from("users")
            .update({ membros: [...grupo.membros, usuario.id] })
            .eq("codigo", codigoGrupo); // Usando a nova coluna codigo
          if (error) throw error;

          grupo.membros.push(usuario.id);
        }

        loginDiv.classList.add("hidden");
        salaDiv.classList.remove("hidden");
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
        const { data: usuarios, error } = await supabaseClient
          .from("users")
          .select("*")
          .in("id", grupo.membros)
          .eq("codigo", grupo.codigo); // Usando a nova coluna codigo

        if (error) {
          console.error("Erro ao carregar membros:", error.message);
          membrosDiv.innerHTML = "<p>Erro ao carregar membros.</p>";
          return;
        }

        membrosDiv.innerHTML = usuarios.map(usuario => `<p><strong>${usuario.nome} (${usuario.curso || "Sem curso"}):</strong> ${usuario.contato} (Grupo: ${usuario.codigo})</p>`).join("");
      } catch (err) {
        console.error("Erro ao carregar membros:", err.message);
        membrosDiv.innerHTML = "<p>Erro ao carregar membros.</p>";
      }
    }

    async function carregarMensagens(grupo) {
      try {
        const { data: grupoAtualizado, error } = await supabaseClient
          .from("users")
          .select("mensagens")
          .eq("codigo", grupo.codigo) // Filtra pelo código do grupo
          .single();

        if (error) {
          console.error("Erro ao buscar mensagens:", error.message);
          throw error;
        }

        const mensagens = grupoAtualizado?.mensagens || [];

        if (mensagens && Array.isArray(mensagens) && mensagens.length > 0) {
          mensagensDiv.innerHTML = mensagens.map(msg => `<p><strong>${msg.nome}:</strong> ${msg.texto}</p>`).join("");
        } else {
          mensagensDiv.innerHTML = "<p>Ainda não há mensagens neste grupo.</p>";
        }
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
        const { data: usuario, error: usuarioError } = await supabaseClient
          .from("users")
          .select("nome")
          .eq("contato", contato)
          .single();

        if (usuarioError) {
          console.error("Erro ao buscar nome do usuário:", usuarioError.message);
          throw usuarioError;
        }

        const nomeUsuario = usuario ? usuario.nome : "Anônimo";

        let { data: grupo, error } = await supabaseClient
          .from("users")
          .select("mensagens")
          .eq("codigo", codigoGrupo) // Filtra pelo código do grupo
          .single();

        if (error) {
          console.error("Erro ao buscar grupo:", error.message);
          throw error;
        }

        const mensagens = grupo?.mensagens || [];

        if (Array.isArray(mensagens)) {
          mensagens.push({ nome: nomeUsuario, texto: mensagemTexto });
        } else {
          console.error("mensagens não é um array:", grupo?.mensagens);
          alert("Erro ao enviar mensagem. Verifique o console para detalhes.");
          return;
        }

        const { error: updateError } = await supabaseClient
          .from("users")
          .update({ mensagens })
          .eq("codigo", codigoGrupo); // Filtra pelo código do grupo

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

    window.supabase = supabaseClient;
  });
});
