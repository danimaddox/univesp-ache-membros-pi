document.addEventListener('DOMContentLoaded', function() {
  window.addEventListener('load', function() {
    // Credenciais do Supabase (substitua pelas suas)
    const supabaseUrl = "https://<seu_id_supabase>.supabase.co";
    const supabaseKey = "<sua_chave_anon_supabase>";

    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // Elementos da interface
    const loginDiv = document.getElementById("login");
    const salaDiv = document.getElementById("sala");
    const nomeSala = document.getElementById("nomeSala");
    const membrosDiv = document.getElementById("membros");
    const mensagensDiv = document.getElementById("mensagens");
    const mensagemInput = document.getElementById("mensagem");

    // Eventos dos botões
    document.getElementById("entrarNoGrupo").addEventListener("click", entrarNoGrupo);
    document.getElementById("enviarMensagem").addEventListener("click", enviarMensagem);

    // Função para obter ou criar usuário
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

    // Função para entrar no grupo
    async function entrarNoGrupo() {
      // ... (resto do código igual ao anterior)
    }

    // Função para carregar membros
    async function carregarMembros(grupo) {
      // ... (resto do código igual ao anterior)
    }

    // Função para carregar mensagens
    async function carregarMensagens(grupo) {
      // ... (resto do código igual ao anterior)
    }

    // Função para enviar mensagem
    async function enviarMensagem() {
      // ... (resto do código igual ao anterior)
    }

    // Exponibiliza o cliente Supabase para uso externo (opcional)
    window.supabase = supabaseClient;
  });
});
