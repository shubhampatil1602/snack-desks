/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,userId]` on the table `member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "menu_category_organizationId_idx" ON "menu_category"("organizationId");

-- CreateIndex
CREATE INDEX "menu_item_organizationId_idx" ON "menu_item"("organizationId");

-- CreateIndex
CREATE INDEX "menu_item_menuCategoryId_idx" ON "menu_item"("menuCategoryId");

-- CreateIndex
CREATE INDEX "menu_item_organizationId_isAvailable_idx" ON "menu_item"("organizationId", "isAvailable");

-- CreateIndex
CREATE INDEX "order_userId_idx" ON "order"("userId");

-- CreateIndex
CREATE INDEX "order_windowId_idx" ON "order"("windowId");

-- CreateIndex
CREATE INDEX "order_organizationId_idx" ON "order"("organizationId");

-- CreateIndex
CREATE INDEX "order_organizationId_createdAt_idx" ON "order"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "order_windowId_status_idx" ON "order"("windowId", "status");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "order"("status");

-- CreateIndex
CREATE INDEX "order_item_orderId_idx" ON "order_item"("orderId");

-- CreateIndex
CREATE INDEX "order_item_menuItemId_idx" ON "order_item"("menuItemId");

-- CreateIndex
CREATE INDEX "order_window_organizationId_idx" ON "order_window"("organizationId");

-- CreateIndex
CREATE INDEX "order_window_status_idx" ON "order_window"("status");

-- CreateIndex
CREATE INDEX "order_window_organizationId_status_idx" ON "order_window"("organizationId", "status");
