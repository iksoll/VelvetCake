using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

[Index("UserId", "IsRead", Name = "IX_Notifications_UserId_IsRead")]
public partial class Notification
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [StringLength(200)]
    public string Title { get; set; } = null!;

    public string Text { get; set; } = null!;

    public bool? IsRead { get; set; }

    public DateTime? SentAt { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Notifications")]
    public virtual User User { get; set; } = null!;
}
