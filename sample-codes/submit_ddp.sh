#!/bin/bash
#SBATCH --job-name=pytorch-ddp
#SBATCH --partition=gpu
#SBATCH --nodes=2
#SBATCH --ntasks-per-node=1
#SBATCH --cpus-per-task=4
#SBATCH --gres=gpu:1
#SBATCH --output=%x-%j.out
#SBATCH --error=%x-%j.err

# ── Environment ──────────────────────────────────────────────────────
module load anaconda/2024.02
eval "$(conda shell.bash hook)"
conda activate /app/anaconda/2024.02/envs/acp

# ── Master node: raw IPv4 from bond1 ────────────────────────────────
export MASTER_HOSTNAME=$(scontrol show hostnames $SLURM_JOB_NODELIST | head -n 1)
export MASTER_ADDR=$(ssh $MASTER_HOSTNAME "ip -4 addr show bond1 | grep 'inet ' | awk '{print \$2}' | cut -d/ -f1")
export MASTER_PORT=29500

# ── Base NCCL network config ─────────────────────────────────────────
export NCCL_SOCKET_IFNAME=bond1
export GLOO_SOCKET_IFNAME=bond1
export NCCL_IB_DISABLE=1

# ── Dynamic GPU & MIG Detection ──────────────────────────────────────
# 1. Safely calculate how many GPUs/MIGs SLURM actually gave this node
if [ -n "$CUDA_VISIBLE_DEVICES" ]; then
    # Count the number of comma-separated items in the variable
    export NPROC_PER_NODE=$(echo $CUDA_VISIBLE_DEVICES | awk -F, '{print NF}')
else
    # Fallback if CUDA_VISIBLE_DEVICES isn't set yet
    export NPROC_PER_NODE=$SLURM_GPUS_ON_NODE
fi

# 2. Check if the allocated hardware is a MIG instance
if [[ "$CUDA_VISIBLE_DEVICES" == *"MIG"* ]] || nvidia-smi -L | grep -qi "mig"; then
    echo "⚙️  Hardware Check: MIG environment detected. Disabling P2P."
    export NCCL_P2P_DISABLE=1
else
    echo "⚙️  Hardware Check: Standard GPU(s) detected. P2P remains enabled."
    # Ensure P2P is not accidentally disabled from a previous environment export
    unset NCCL_P2P_DISABLE
fi

# ── Sanity checks ────────────────────────────────────────────────────
echo "================================================"
echo "MASTER_HOSTNAME : $MASTER_HOSTNAME"
echo "MASTER_ADDR     : $MASTER_ADDR"
echo "MASTER_PORT     : $MASTER_PORT"
echo "NODELIST        : $SLURM_JOB_NODELIST"
echo "JOB_ID          : $SLURM_JOB_ID"
echo "GPUS_PER_NODE   : $NPROC_PER_NODE"
echo "================================================"

# Guard: abort if MASTER_ADDR is empty or IPv6
if [[ -z "$MASTER_ADDR" || "$MASTER_ADDR" == *":"* ]]; then
    echo "ERROR: MASTER_ADDR='$MASTER_ADDR' is empty or IPv6 — aborting"
    exit 1
fi

# Per-node confirmation
srun bash -c 'echo "[$(hostname)] NODEID=$SLURM_NODEID | MASTER=$MASTER_ADDR | MY_IP=$(ip -4 addr show bond1 | grep inet | awk '"'"'{print $2}'"'"' | cut -d/ -f1)"'

# ── Launch ───────────────────────────────────────────────────────────
# We use the dynamically calculated $NPROC_PER_NODE here
srun torchrun \
    --nnodes=$SLURM_NNODES \
    --nproc_per_node=$NPROC_PER_NODE \
    --node_rank=$SLURM_NODEID \
    --rdzv_id=$SLURM_JOB_ID \
    --rdzv_backend=c10d \
    --rdzv_endpoint=$MASTER_ADDR:$MASTER_PORT \
    mnist_ddp.py