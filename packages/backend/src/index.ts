import { app } from './app'
import { environment } from './core/EnvVars'

const PORTA = environment.HTTP_PORT;
console.log(PORTA)

app.listen(PORTA, () => {
    console.log('Server express rodando na port', PORTA);
})