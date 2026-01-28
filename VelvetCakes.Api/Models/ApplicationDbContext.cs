using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace VelvetCakes.Api.Models;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cart> Carts { get; set; }

    public virtual DbSet<Component> Components { get; set; }

    public virtual DbSet<CustomCake> CustomCakes { get; set; }

    public virtual DbSet<CustomCakeComponent> CustomCakeComponents { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=localhost;Database=VelvetCakes;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Cart__3214EC071BE5D092");

            entity.Property(e => e.AddedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.CustomCake).WithMany(p => p.Carts)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__Cart__CustomCake__48CFD27E");

            entity.HasOne(d => d.Product).WithMany(p => p.Carts)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__Cart__ProductId__47DBAE45");

            entity.HasOne(d => d.User).WithMany(p => p.Carts).HasConstraintName("FK__Cart__UserId__46E78A0C");
        });

        modelBuilder.Entity<Component>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Componen__3214EC07237D488F");

            entity.Property(e => e.ComplexityPoints).HasDefaultValue(0);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsSeasonal).HasDefaultValue(false);
        });

        modelBuilder.Entity<CustomCake>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CustomCa__3214EC07354A90C0");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Name).HasDefaultValue("Индивидуальный торт");

            entity.HasOne(d => d.User).WithMany(p => p.CustomCakes).HasConstraintName("FK__CustomCak__UserI__3B75D760");
        });

        modelBuilder.Entity<CustomCakeComponent>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CustomCa__3214EC07DE24AB9E");

            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Component).WithMany(p => p.CustomCakeComponents)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__CustomCak__Compo__412EB0B6");

            entity.HasOne(d => d.CustomCake).WithMany(p => p.CustomCakeComponents).HasConstraintName("FK__CustomCak__Custo__403A8C7D");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3214EC07C25882E1");

            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.SentAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications).HasConstraintName("FK__Notificat__UserI__656C112C");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Orders__3214EC071C60A195");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.PaidAmount).HasDefaultValue(0m);
            entity.Property(e => e.Status).HasDefaultValue("Новый");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.User).WithMany(p => p.Orders).HasConstraintName("FK__Orders__UserId__534D60F1");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__OrderIte__3214EC07B5701DC7");

            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.CustomCake).WithMany(p => p.OrderItems)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__OrderItem__Custo__5AEE82B9");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems).HasConstraintName("FK__OrderItem__Order__59063A47");

            entity.HasOne(d => d.Product).WithMany(p => p.OrderItems)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__OrderItem__Produ__59FA5E80");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Products__3214EC07433655F9");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Reviews__3214EC072CE4C9D0");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews).HasConstraintName("FK__Reviews__UserId__60A75C0F");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Roles__3214EC07FD704E76");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC0771E1803D");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Role).WithMany(p => p.Users)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Users__RoleId__29572725");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
