import { useWallet } from '@solana/wallet-adapter-react';

export default function ConnectWallet() {
  const { connect, connected, publicKey, signMessage } = useWallet();

  const handleAuth = async () => {
    const message = "deepfry-validator-auth";
    const encoded = new TextEncoder().encode(message);
    const signature = await signMessage?.(encoded);

    const res = await fetch('/api/verify-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: publicKey?.toBase58(),
        message,
        signature: Array.from(signature ?? []),
      }),
    });

    const json = await res.json();
    console.log("✅ Auth verified:", json);
  };

  return (
    <div>
      <button onClick={connected ? handleAuth : connect}>
        {connected ? "Sign & Register Validator" : "Connect Wallet"}
      </button>
    </div>
  );
}
