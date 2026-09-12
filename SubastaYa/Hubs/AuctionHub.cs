using Microsoft.AspNetCore.SignalR;

namespace SubastaYa.Hubs;

public class AuctionHub : Hub
{
    public async Task JoinAuction(int auctionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"auction-{auctionId}");
    }

    public async Task LeaveAuction(int auctionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"auction-{auctionId}");
    }
}
