import axios from 'axios'
import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { isAuthenticated, logout as authLogout } from '../components/auth'
import '../App.css'
import { Link } from 'react-router-dom'

const api = import.meta.env.VITE_API || "http://localhost:3000"

type Veiculo = {
    tipo: string;
    proprietario: string;
    telefone: string;
    placa: string;
    modelo: string;
    marca: string;
    cor: string;
    ano: number;
    usuarioId: number;
};

function Veiculos() {
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    const [veiculos, setVeiculos] = useState<Veiculo[]>([])
    const [alertMessage, setAlertMessage] = useState("")
    const [msgErro, setMsgErro] = useState("")
    const [openDialog, setOpenDialog] = useState(false)
    const [editData, setEditData] = useState<Veiculo | null>(null)
    const [tipo, setTipo] = useState<string>("");
    const usuario = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id

    const editarVeiculo = (placa: string) => {
        const veiculo = veiculos.find(v => v.placa === placa);
        if (veiculo) {
            setEditData(veiculo);
            setTipo(veiculo.tipo);
            setOpenDialog(true);
        }
    };

    const obterVeiculos = async () => {
        const token = localStorage.getItem('token');
        const header = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        try {
            const response = await axios.get(`${api}/veiculos`, header)
            setVeiculos(response.data)
        } catch (error) {
            console.error("Erro ao obter veiculos:", error)
        }
    }

    const excluirVeiculo = async (placa: String) => {
        if (confirm(`Confirma a exclusão do veículo placa: ${placa}`)) {
            const token = localStorage.getItem('token');
            const header = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            axios.delete(`${api}/veiculos/${placa}`, header)
                .then((response) => {
                    if (response.status === 204) {
                        setAlertMessage("Veículo excluído com sucesso.");
                        obterVeiculos();
                    }
                }).catch((error) => {
                    setAlertMessage("Erro ao excluir veículo.");
                });
        }
    }

    const submitVeiculo = async (event) => {
        event.preventDefault();
        let placaValue = "";
        if (editData) {
            // Se for edição, a placa está desabilitada, então pega do editData
            placaValue = editData.placa;
        } else {
            // Se for novo, pega do input
            placaValue = (event.target as any).placa.value.toUpperCase();
        }
        const dados = {
            tipo: tipo || "CARRO",
            proprietario: (event.target as any).proprietario.value,
            telefone: (event.target as any).telefone.value,
            placa: placaValue,
            modelo: (event.target as any).modelo.value,
            marca: (event.target as any).marca.value,
            cor: (event.target as any).cor.value,
            ano: Number((event.target as any).ano.value),
            usuarioId: usuario
        };
        const token = localStorage.getItem('token');
        const header = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        if (editData) {
            console.log(dados)
            try {
                const response = await axios.patch(`${api}/veiculos/${editData.placa}`, dados, header);
                if (response.status === 202) {
                    setAlertMessage("Veículo atualizado com sucesso.");
                    obterVeiculos()
                    setOpenDialog(false)
                }
            } catch (error) {
                setAlertMessage("Erro ao atualizar veículo.");
            }
        } else {
            axios.post(`${api}/veiculos`, dados, header)
                .then((response) => {
                    if (response.status === 201) {
                        setAlertMessage("Veículo cadastrado com sucesso.");
                        obterVeiculos()
                        setOpenDialog(false)
                    }
                }).catch((error) => {
                    setAlertMessage(`Erro ao cadastrar veículo.`);
                });
        }
    }



    useEffect(() => {
        if (isAuth) obterVeiculos();
    }, []);


    const handleLogout = () => authLogout();

    useEffect(() => {
        if (openDialog && !editData) setTipo("");
    }, [openDialog, editData]);

    return (<>
        <Dialog open={openDialog} onOpenChange={(open) => { setOpenDialog(open); if (!open) setEditData(null); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editData ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
                    <DialogDescription>
                        {msgErro && (
                            <Alert variant="destructive" className="w-full truncate whitespace-nowrap">
                                {msgErro}
                            </Alert>
                        )}
                    </DialogDescription>
                    <form onSubmit={submitVeiculo}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label htmlFor="tipo">Tipo</label>
                                    <Select name="tipo" value={tipo || (editData ? editData.tipo : "CARRO")} onValueChange={setTipo}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CARRO">Carro</SelectItem>
                                            <SelectItem value="MOTO">Moto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="proprietario">Proprietário</label>
                                    <Input name="proprietario" required defaultValue={editData?.proprietario || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="telefone">Telefone</label>
                                    <Input name="telefone" required defaultValue={editData?.telefone || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="placa">Placa</label>
                                    <Input name="placa" required defaultValue={editData?.placa || ''} disabled={!!editData} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="modelo">Modelo</label>
                                    <Input name="modelo" required defaultValue={editData?.modelo || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="marca">Marca</label>
                                    <Input name="marca" required defaultValue={editData?.marca || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="cor">Cor</label>
                                    <Input name="cor" defaultValue={editData?.cor || ''} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="ano">Ano</label>
                                    <Input name="ano" defaultValue={editData?.ano || ''} />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </DialogHeader>
            </DialogContent>
        </Dialog>
        <header>
            <h1 className="text-2xl font-bold">Gestão de Veículos</h1>
            <nav>
                <>
                    <Link to="/estacionamento-web-2025/">
                        <Button variant="outline" size="lg">Home</Button>
                    </Link>
                    <Link to="/estacionamento-web-2025/veiculos">
                        <Button variant="outline" size="lg">Veículos</Button>
                    </Link>
                    <Link to="/estacionamento-web-2025/report">
                        <Button variant="outline" size="lg">Relatório</Button>
                    </Link>
                    <Button variant="outline" size="lg" onClick={() => setOpenDialog(true)}>Novo Veículo</Button>
                    <Button variant="outline" size="lg" onClick={handleLogout}>Logout</Button>
                </>
            </nav>
            <div className="flex justify-between items-center w-full">
                <h2>Todos os veículos</h2>
            </div>
        </header>
        <main>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Proprietário</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead>Ano</TableHead>
                        <TableHead>Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {veiculos.map((veiculo) => (
                        <TableRow key={veiculo.placa}>
                            <TableCell data-label="TIPO">{veiculo.tipo}</TableCell>
                            <TableCell data-label="PROPRIETARIO">{veiculo.proprietario}</TableCell>
                            <TableCell data-label="TELEFONE">{veiculo.telefone}</TableCell>
                            <TableCell data-label="PLACA">{veiculo.placa}</TableCell>
                            <TableCell data-label="MODELO">{veiculo.modelo}</TableCell>
                            <TableCell data-label="MARCA">{veiculo.marca}</TableCell>
                            <TableCell data-label="COR">{veiculo.cor}</TableCell>
                            <TableCell data-label="ANO">{veiculo.ano}</TableCell>
                            <TableCell>
                                <span style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button variant="outline" size="sm" onClick={() => editarVeiculo(veiculo.placa)}>Editar</Button>
                                    <Button variant="destructive" size="sm" onClick={() => excluirVeiculo(veiculo.placa)}>Excluir</Button>
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </main>
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
    </>)
}

export default Veiculos
