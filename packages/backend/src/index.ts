import { app } from './app'
import { environment } from './core/EnvVars'
import { seed } from '../prisma/seed';

const PORTA = environment.HTTP_PORT;
console.log(PORTA)

app.listen(PORTA, () => {
    console.log('Server express rodando na port', PORTA);
    seed();
})