import os
import time
from twilio.rest import Client

# Tenta carregar do .env se existir (opcional, mas recomendado)
# Se não tiver python-dotenv, ele usará as variáveis do sistema
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', 'SUA_ACCOUNT_SID')
AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', 'SEU_AUTH_TOKEN')
MEU_NUMERO_TWILIO = os.environ.get('TWILIO_PHONE_NUMBER', '+17125435362')

def monitorar_sms():
    try:
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
    except Exception as e:
        print(f"Erro ao inicializar Twilio: {e}")
        return

    print(f"\n[SISTEMA] Monitoramento iniciado para: {MEU_NUMERO_TWILIO}")
    print("[INFO] Use este numero no site e os SMS aparecerao aqui em tempo real.\n")
    print("Aguardando novas mensagens... (Ctrl+C para sair)")

    # Conjunto para evitar mostrar mensagens antigas
    mensagens_vistas = set()
    
    # Carrega as mensagens existentes antes de começar para nao repetir
    try:
        historico = client.messages.list(to=MEU_NUMERO_TWILIO, limit=20)
        for m in historico:
            mensagens_vistas.add(m.sid)
    except Exception as e:
        print(f"Erro ao carregar historico: {e}")

    try:
        while True:
            # Busca as mensagens mais recentes enviadas PARA o nosso numero
            mensagens = client.messages.list(to=MEU_NUMERO_TWILIO, limit=5)
            
            for msg in mensagens:
                if msg.sid not in mensagens_vistas:
                    print("\n" + "="*50)
                    print(f"!!! NOVA MENSAGEM RECEBIDA !!!")
                    print(f"DE: {msg.from_}")
                    print(f"DATA: {msg.date_sent}")
                    print(f"CONTEUDO: {msg.body}")
                    print("="*50)
                    
                    mensagens_vistas.add(msg.sid)
            
            time.sleep(5) # Aguarda 5 segundos antes de checar de novo
            
    except KeyboardInterrupt:
        print("\nMonitoramento encerrado pelo usuario.")
    except Exception as e:
        print(f"\nErro durante o monitoramento: {e}")

if __name__ == '__main__':
    # Verifica se as chaves foram preenchidas
    if ACCOUNT_SID == 'SUA_ACCOUNT_SID':
        print("ERRO: Voce precisa colocar seu ACCOUNT_SID, AUTH_TOKEN e NUMERO no topo do arquivo!")
    else:
        monitorar_sms()