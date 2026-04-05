import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torchvision import datasets, transforms
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler
from torch.distributed import init_process_group, destroy_process_group

class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, 1)
        self.conv2 = nn.Conv2d(32, 64, 3, 1)
        self.dropout1 = nn.Dropout(0.25)
        self.dropout2 = nn.Dropout(0.5)
        self.fc1 = nn.Linear(9216, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.conv1(x)
        x = F.relu(x)
        x = self.conv2(x)
        x = F.relu(x)
        x = F.max_pool2d(x, 2)
        x = self.dropout1(x)
        x = torch.flatten(x, 1)
        x = self.fc1(x)
        x = F.relu(x)
        x = self.dropout2(x)
        x = self.fc2(x)
        output = F.log_softmax(x, dim=1)
        return output

def train(model, device, train_loader, optimizer, epoch, rank):
    model.train()
    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)
        optimizer.zero_grad()
        output = model(data)
        loss = F.nll_loss(output, target)
        loss.backward()
        optimizer.step()
        if batch_idx % 10 == 0 and rank == 0:
            print(f"Train Epoch: {epoch} [{batch_idx * len(data)}/{len(train_loader.dataset)} "
                  f"({100. * batch_idx / len(train_loader):.0f}%)]\tLoss: {loss.item():.6f}")

def ddp_setup():
    # Tell PyTorch which GPU to use FIRST
    torch.cuda.set_device(int(os.environ["LOCAL_RANK"])) 
    # THEN initialize the process group
    init_process_group(backend="nccl")
    print(f"Process Group initialized...")

def main():
    ddp_setup()
    
    rank = int(os.environ["RANK"])
    local_rank = int(os.environ["LOCAL_RANK"])
    device = torch.device(f"cuda:{local_rank}")

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    
    # Use the environment variable from your SLURM script
    data_path = os.environ.get("MNIST_DATA_PATH", "./data")
    
    # Download dataset only on rank 0
    if rank == 0:
        datasets.MNIST(data_path, train=True, download=True, transform=transform)
        
    # EXPLICITLY pass the device_ids to the barrier to prevent the MIG hang
    torch.distributed.barrier(device_ids=[local_rank])
    
    dataset = datasets.MNIST(data_path, train=True, transform=transform)
    sampler = DistributedSampler(dataset, shuffle=True)
    train_loader = torch.utils.data.DataLoader(dataset, batch_size=64, sampler=sampler)

    model = Net().to(device)
    model = DDP(model, device_ids=[local_rank])
    optimizer = optim.Adadelta(model.parameters(), lr=1.0)

    for epoch in range(1, 2): # Just 1 epoch for testing
        sampler.set_epoch(epoch)
        train(model, device, train_loader, optimizer, epoch, rank)

    destroy_process_group()

if __name__ == "__main__":
    main()
