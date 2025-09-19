import { useState, useEffect } from 'react'
import { login as authLogin, logout as authLogout, isAuthenticated } from './components/auth'
import { Routes, Route, Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert } from "@/components/ui/alert"
import axios from 'axios'
import './App.css'
import Report from './pages/relatorios'
import Veiculos from './pages/veiculos'

const uri = "./dados.json"
const api = "https://estacionamentoapi2025.vercel.app"


function getCurrentDateTimeLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function App() {

  const [estadias, setEstadias] = useState([]);
  const [carros, setCarros] = useState(0);
  const [motos, setMotos] = useState(0);
  const [vagaCarro, setVagaCarro] = useState(0);
  const [vagaMoto, setVagaMoto] = useState(0);
  const [valorHora, setValorHora] = useState(0);
  const [isAuth, setIsAuth] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [msgErro, setMsgErro] = useState("");
  const [idEstadia, setIdEstadia] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const usuario = localStorage.getItem('token') ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id : 0

  const obterDados = async () => {
    const response = await axios.get(uri)
    setCarros(response.data.vagas[0].quantidade)
    setMotos(response.data.vagas[1].quantidade)
    setValorHora(response.data.valorHora)
  }

  const obterEstadiasHoje = async () => {
    await obterDados()
    const response = await axios.get(`${api}/hoje`)
    await setEstadias(response.data)
  }

  const calcularVagas = () => {
    estadias.forEach(estadia => {
      if (estadia.automovel != undefined) {
        if (estadia.automovel.tipo == "CARRO") {
          setVagaCarro((prev) => prev + 1)
        } else {
          setVagaMoto((prev) => prev + 1)
        }
      }
    })
  }

  const [openLogin, setOpenLogin] = useState(false)
  const openDialogLogin = () => {
    setOpenLogin(true)
  }

  const [openSaida, setOpenSaida] = useState(false)
  const [saidaDateTime, setSaidaDateTime] = useState(getCurrentDateTimeLocal());
  const openDialogSaida = (id: number) => {
    setIdEstadia(id);
    setValorTotal(calcularValorTotal());
    setSaidaDateTime(getCurrentDateTimeLocal());
    setOpenSaida(true);
  }

  const [openEntrada, setOpenEntrada] = useState(false)
  const [entradaDateTime, setEntradaDateTime] = useState(getCurrentDateTimeLocal());
  const openDialogEntrada = () => {
    setEntradaDateTime(getCurrentDateTimeLocal());
    setOpenEntrada(true);
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setMsgErro("");
    const email = event.target.email.value;
    const senha = event.target.senha.value;
    const token = await authLogin(email, senha);
    if (token) {
      window.location.reload();
    } else {
      setMsgErro("Erro ao realizar login. Verifique suas credenciais.");
    }
  }

  const handleLogout = () => {
    authLogout();
  }

  useEffect(() => {
    obterEstadiasHoje();
    calcularVagas();
  }, [estadias.length]);

  useEffect(() => {
    setValorTotal(calcularValorTotal());
  }, [idEstadia]);

  useEffect(() => {
    (async () => {
      setIsAuth(await isAuthenticated());
    })();
  }, []);

  const calcularValorTotal = () => {
    const estadia = estadias.find(e => e.id === idEstadia);
    if (estadia) {
      const entrada = new Date(estadia.entrada);
      const saida = new Date(saidaDateTime);
      const diffMs = saida.getTime() - entrada.getTime();
      const diffHoras = Math.ceil(diffMs / (1000 * 60 * 60));
      return diffHoras * estadia.valorHora;
    } else return 0;
  }

  const registrarEntrada = async (event) => {
    event.preventDefault();
    setMsgErro("");
    const token = localStorage.getItem('token');
    const dados = {
      placa: event.target.placa.value.toUpperCase(),
      entrada: entradaDateTime + ":00.000Z",
      valorHora,
      usuarioId: usuario
    }
    console.log(dados)
    const header = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.post(`${api}/estadias`, dados, header);
      if (response.status === 201) {
        setAlertMessage("Estacionamento registrado com sucesso.");
        setOpenEntrada(false);
        obterEstadiasHoje();
      } else {
        setMsgErro("Erro ao registrar, verifique se a placa está cadastrada.");
      }
    } catch (error) {
      setMsgErro(`Erro ao registrar, verifique se a placa está cadastrada.`);
    }
  }

  const registrarSaida = async (event) => {
    event.preventDefault();
    setMsgErro("");
    const token = localStorage.getItem('token');
    const header = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    try {
      const response = await axios.patch(
        `${api}/estadias/${idEstadia}`,
        { saida: saidaDateTime + ":00.000Z", valorTotal },
        header
      );
      if (response.status === 200 || response.status === 202) {
        setAlertMessage("Saída registrada com sucesso.");
        setOpenSaida(false);
        obterEstadiasHoje();
      } else {
        setMsgErro("Erro ao registrar saída.");
      }
    } catch (error) {
      setMsgErro(`Erro ao registrar saída.`);
    }
  }

  const excluir = (id: number) => {
    if (confirm(`Confirma a exclusão da estadia ${id} estadia?`)) {
      const token = localStorage.getItem('token');
      const header = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      axios.delete(`${api}/estadias/${id}`, header)
        .then((response) => {
          if (response.status === 204) {
            setAlertMessage("Veículo excluído com sucesso.");
            window.location.reload();
          }
        }).catch((error) => {
          setAlertMessage("Erro ao excluir veículo.");
        });
    }
  }

  return (
    <Routes>
      <Route path="/" element={
        <>
          <Dialog open={openLogin} onOpenChange={setOpenLogin}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Login</DialogTitle>
                <DialogDescription>
                  Acesse o sistema de administração do estacionamento.
                </DialogDescription>
                {msgErro && (
                  <Alert variant="destructive" className="w-full truncate whitespace-nowrap">
                    {msgErro}
                  </Alert>
                )}
              </DialogHeader>
              <form className="grid gap-4 py-4" onSubmit={handleLogin}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">E-mail</label>
                  <input type="email" name="email" className="bg-transparent border border-slate-200 focus:border-slate-300 rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Digite seu e-mail" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Senha</label>
                  <input type="password" name="senha" className="bg-transparent border border-slate-200 focus:border-slate-300 rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Digite sua senha" required />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button type="submit">Entrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openSaida} onOpenChange={setOpenSaida}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Saída</DialogTitle>
                <DialogDescription>
                  Registrar saída do veículo estacionado sob estadia id: {idEstadia}.
                </DialogDescription>
                {msgErro && (
                  <Alert variant="destructive" className="w-full truncate whitespace-nowrap">
                    {msgErro}
                  </Alert>
                )}
              </DialogHeader>
              <form className="grid gap-4 py-4" onSubmit={registrarSaida}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Data e hora da saída</label>
                  <input
                    type="datetime-local"
                    name="saida"
                    value={saidaDateTime}
                    onChange={e => setSaidaDateTime(e.target.value)}
                    className="bg-transparent border border-slate-200 focus:border-slate-300 rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Valor cobrado</label>
                  <input
                    type="number"
                    name="valorCobrado"
                    value={valorTotal}
                    onChange={e => setValorTotal(Number(e.target.value))}
                    className="bg-transparent border border-slate-200 focus:border-slate-300 rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button type="submit">Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={openEntrada} onOpenChange={setOpenEntrada}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Entrada</DialogTitle>
                <DialogDescription>
                  Registrar entrada de veículo.
                </DialogDescription>
                {msgErro && (
                  <Alert variant="destructive" className="w-full truncate whitespace-nowrap">
                    {msgErro}
                  </Alert>
                )}
              </DialogHeader>
              <form className="grid gap-4 py-4" onSubmit={registrarEntrada}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Placa</label>
                  <input type="text" name="placa" className="bg-transparent border border-slate-200 focus:border-slate-300 rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Digite a placa do Veículo" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Data e hora da entrada</label>
                  <input
                    type="datetime-local"
                    name="entrada"
                    value={entradaDateTime}
                    onChange={e => setEntradaDateTime(e.target.value)}
                    className="bg-transparent border border-slate-200 focus:border-slate-300 rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Valor por hora</label>
                  <input
                    type="number"
                    name="valorHora"
                    value={valorHora}
                    onChange={e => setValorHora(Number(e.target.value))}
                    className="bg-transparent border border-slate-200 focus:border-slate-300 rounded-md px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Digite o valor por hora"
                    required
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <Button type="submit">Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <header>
            <h1 className="text-2xl font-bold">Estacionamento Zé Leitão</h1>
            <nav>
              {!isAuth ? (
                <Button variant="outline" size="lg" onClick={openDialogLogin}>Login</Button>
              ) : (
                <>
                  <Link to="/">
                    <Button variant="outline" size="lg">Home</Button>
                  </Link>
                  <Link to="/veiculos">
                    <Button variant="outline" size="lg">Veículos</Button>
                  </Link>
                  <Link to="/report">
                    <Button variant="outline" size="lg">Relatório</Button>
                  </Link>
                  <Button variant="outline" size="lg" onClick={openDialogEntrada}>Novo Estacionamento</Button>
                  <Button variant="outline" size="lg" onClick={handleLogout}>Logout</Button>
                </>
              )}
            </nav>
          </header>
          <main className="flex flex-wrap gap-4 justify-center">
            {estadias.map((estadia) => (
              <Card key={estadia.id} className="max-w-xs flex flex-row items-center p-4 m-2">
                <div>
                  <img src={estadia.automovel ? estadia.automovel.tipo === "CARRO" ? "/assets/logo.png" : "/assets/moto.webp" : "/assets/x.webp"} alt={estadia.automovel ? estadia.automovel.tipo : "Excluído"} className="w-24 h-auto mr-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold mb-2">{estadia.automovel ? estadia.automovel.placa : "EXCLUÍDO"}</h3>
                  <p>Entrada: {new Date(estadia.entrada).toLocaleString('pt-BR')}</p>
                  <p>Valor da hora: R$ {estadia.valorHora.toFixed(2)}</p>
                  {isAuth ? <p><Button variant="outline" size="lg" onClick={() => excluir(estadia.id)}>Cancelar</Button><Button variant="outline" size="lg" onClick={() => openDialogSaida(estadia.id)}>Saída</Button></p> : ""}
                </div>
              </Card>
            ))}
          </main>
          <footer className="flex flex-wrap gap-4 justify-center">
            <h2>Vagas de Carro: {carros - vagaCarro} / {carros} Vagas de Moto: {motos - vagaMoto} / {motos}</h2>
          </footer>
          {alertMessage && (
            <Dialog open={!!alertMessage} onOpenChange={() => setAlertMessage("")}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sistema</DialogTitle>
                  <DialogDescription>
                    Mensagem do sistema:
                  </DialogDescription>
                  <Alert variant="destructive" className="w-full truncate whitespace-nowrap">
                    {alertMessage}
                  </Alert>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
        </>
      } />
      <Route path="/report" element={<Report />} />
      <Route path="/veiculos" element={<Veiculos />} />
    </Routes>
  )
}

export default App
