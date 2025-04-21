// import { Router, Request, Response } from "express";
// import prisma from "../prismaClient";
// import { ethers } from "ethers";
// import dotenv from "dotenv";

// dotenv.config();
// const router = Router();

// /**
//  * User submits payment to activate a validator.
//  * You’d integrate your Web3 logic here.
//  */
// router.post("/pay", async (req: Request, res: Response) => {
//   const { userId, validatorId, amount, paymentMethodData } = req.body;
//   try {
//     // 1. Create a PENDING Payment record
//     const payment = await prisma.payment.create({
//       data: { userId, validatorId, amount }
//     });

//     // 2. Kick off on‑chain transfer (example using ethers.js)
//     //    — you’d normally send the tx from your backend 
//     //      or redirect the user to sign it client‑side.
//     const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
//     const signer   = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
//     const tx       = await signer.sendTransaction({
//       to: paymentMethodData.recipientAddress,
//       value: ethers.utils.parseUnits(amount.toString(), "ether")
//     });

//     // 3. Wait for confirmation, update status
//     const receipt = await tx.wait();
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: { status: "SUCCESS", txHash: receipt.transactionHash }
//     });

//     res.json({ success: true, txHash: receipt.transactionHash });
//   } catch (err: any) {
//     // mark as failed
//     if (err?.code && err.code !== "user_rejected") {
//       await prisma.payment.update({
//         where: { id: Number(req.body.paymentId) },
//         data: { status: "FAILED" }
//       });
//     }
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// export default router;
