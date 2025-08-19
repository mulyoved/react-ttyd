import { Ttyd } from 'react-ttyd';
import 'react-ttyd/dist/index.css';

function App() {
    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
            }}
        >
            <Ttyd
                wsUrl="ws://localhost:7681/ws"
                clientOptions={{
                    rendererType: 'canvas',
                }}
            />
        </div>
    );
}

export default App;
