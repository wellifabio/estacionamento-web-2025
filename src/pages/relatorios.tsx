import axios from 'axios'
import { useEffect, useState } from 'react'
import { isAuthenticated, logout as authLogout } from '../components/auth'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import '../App.css'
import { Link } from 'react-router-dom'

const api = import.meta.env.VITE_API || "http://localhost:3000"


function Report() {
    const [isAuth, setIsAuth] = useState(isAuthenticated());
    const [estadias, setEstadias] = useState([])
    const [estadiasFiltradas, setEstadiasFiltradas] = useState([])
    const [total, setTotal] = useState(0)
    const [alertMessage, setAlertMessage] = useState("")

    const obterEstadias = async () => {
        const token = localStorage.getItem('token');
        const header = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        try {
            const response = await axios.get(`${api}/estadias`, header)
            setEstadias(response.data)
        } catch (error) {
            console.error("Erro ao obter estadias:", error)
        }
    }

    const filtrarEstadias = () => {
        setEstadiasFiltradas(estadias.filter(estadia => estadia.saida !== null))
        let totalArrecadado = 0
        estadiasFiltradas.forEach(estadia => {
            totalArrecadado += estadia.valorTotal
        })
        setTotal(totalArrecadado)
    }


    useEffect(() => {
        if (isAuth) obterEstadias();
    }, []);

    const handleLogout = () => authLogout();

    useEffect(() => {
        filtrarEstadias()
    }, [estadias])

    return (<>
        <header>
            <h1 className="text-2xl font-bold">Relatório de Estadias</h1>
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
                    <Button variant="outline" size="lg" onClick={handleLogout}>Logout</Button>
                </>
            </nav>
            <div className="flex justify-between items-center w-full">
                <h2>Todas as estadias</h2>
            </div>
        </header>
        <main>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Hora de Entrada</TableHead>
                        <TableHead>Hora de Saída</TableHead>
                        <TableHead>Valor da Hora (R$)</TableHead>
                        <TableHead>Valor Calculado (R$)</TableHead>
                        <TableHead>Valor Cobrado (R$)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {estadiasFiltradas.map((estadia) => (
                        <TableRow key={estadia.id}>
                            <TableCell data-label="ID">{estadia.id}</TableCell>
                            <TableCell data-label="VEICULO">{estadia.placa}</TableCell>
                            <TableCell data-label="HORA DE ENTRADA">{new Date(estadia.entrada).toLocaleString()}</TableCell>
                            <TableCell data-label="HORA DE SAIDA">{new Date(estadia.saida).toLocaleString()}</TableCell>
                            <TableCell data-label="VALOR DA HORA (R$)">R$ {estadia.valorHora.toFixed(2)}</TableCell>
                            <TableCell data-label="VALOR CALCULADO (R$)">R$ {(((new Date(estadia.saida).getTime() - new Date(estadia.entrada).getTime()) / 3600000) * estadia.valorHora).toFixed(2)}</TableCell>
                            <TableCell data-label="VALOR COBRADO (R$)">R$ {estadia.valorTotal ? estadia.valorTotal.toFixed(2) : 0}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={6} className="text-right font-bold">Total Arrecadado:</TableCell>
                        <TableCell className="font-bold">R$ {total.toFixed(2)}</TableCell>
                    </TableRow>
                </TableFooter>
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

export default Report
