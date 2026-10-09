// ============================================================
// MY ACCOUNT — load, edit details, change photo, change password,
// plus role-specific read-only tabs (Farmer / Supplier / Supermarket)
// ============================================================

(function () {
    let accCurrentUser = null;
    let accPendingImageBase64 = null;
    let accPendingImageRemoved = false;

    let accCropRows = [];
    let accIngredientRows = [];

    $(document).ready(function () {
        loadMyAccount();
        bindAccountEvents();
    });

// ============================================================
// LOAD
// ============================================================
    function loadMyAccount() {
        $.ajax({
            url: "/user/account/me",
            method: "GET",
            success: function (user) {
                accCurrentUser = user;
                renderAccount(user);
            },
            error: function () {
                Notiflix.Notify.failure("Could not load account details.");
            }
        });
    }

    function renderAccount(user) {
        $("#accDisplayUsername").text("@" + (user.username || ""));
        $("#accUsername").val(user.username || "");
        $("#accEmail").val(user.email || "");
        $("#accNote").val(user.note || "");

        renderAccountOwner(user);
        renderAccountRoleTabs(user);

        $("#accCreatedDate").text(formatAccDate(user.addeddatetime));
        $("#accUpdatedDate").text(formatAccDate(user.updateddatetime));

        const dot = $("#accStatusDot");
        dot.removeClass().addClass("acc-status-dot acc-status-" + user.status);
        $("#accStatusText").text(user.status);

        const roleWrap = $("#accRoleBadges").empty();
        (user.roles || []).forEach(function (r) {
            roleWrap.append(
                '<span class="badge bg-success-subtle text-success-emphasis border border-success-subtle acc-role-badge">' +
                r.name + "</span>"
            );
        });

        if (user.imageBase64) {
            $("#accAvatarImg").attr("src", user.imageBase64).show();
            $("#accAvatarFallback").hide();
        } else {
            $("#accAvatarImg").hide();
            $("#accAvatarFallback").show();
        }
    }

    function renderAccountOwner(user) {
        const typeBadge = $("#accTypeBadge");
        let ownerName = "-";
        let secondaryLabel = "-";
        let ownerRowText = "Owner";
        let roleRowText = "Type";

        if (user.accounttype === "Employee" && user.employee) {
            ownerRowText = "Employee";
            roleRowText = "Designation";
            ownerName = user.employee.fullname || user.employee.name || "-";
            secondaryLabel = user.employee.designation ? user.employee.designation.name : "-";
            typeBadge.text("Employee").removeClass().addClass("badge rounded-pill acc-type-badge acc-type-EMPLOYEE").show();

        } else if (user.accounttype === "Farmer" && user.farmer) {
            ownerRowText = "Farmer";
            roleRowText = "Customer type";
            ownerName = user.farmer.name || user.farmer.fullname || "-";
            secondaryLabel = "Farmer";
            typeBadge.text("Farmer").removeClass().addClass("badge rounded-pill acc-type-badge acc-type-FARMER").show();

        } else if (user.accounttype === "Supermarket" && user.supermarket) {
            ownerRowText = "Supermarket";
            roleRowText = "Customer type";
            ownerName = user.supermarket.name || user.supermarket.supermarketname || "-";
            secondaryLabel = "Supermarket";
            typeBadge.text("Supermarket").removeClass().addClass("badge rounded-pill acc-type-badge acc-type-SUPERMARKET").show();

        } else if (user.accounttype === "Supplier" && user.supplier) {
            ownerRowText = "Supplier";
            roleRowText = "Customer type";
            ownerName = user.supplier.name || user.supplier.suppliername || "-";
            secondaryLabel = "Supplier";
            typeBadge.text("Supplier").removeClass().addClass("badge rounded-pill acc-type-badge acc-type-SUPPLIER").show();

        } else {
            typeBadge.hide();
        }

        $("#accOwnerRowLabel").text(ownerRowText);
        $("#accRoleRowLabel").text(roleRowText);
        $("#accEmployeeName").text(ownerName);
        $("#accDesignation").text(secondaryLabel);
        $("#accDisplayName").text(ownerName !== "-" ? ownerName : (user.username || "Loading..."));
    }

    function renderAccountRoleTabs(user) {
        $("#navTabCrops, #navTabCompost, #navTabIngredients, #navTabBalance").addClass("d-none");

        if (user.accounttype === "Farmer" && user.farmer) {
            $("#navTabCrops, #navTabCompost").removeClass("d-none");

            const isCompostCustomer = !!user.farmer.compost;
            $("#accCompostCustomerBadge").toggle(isCompostCustomer);
            $("#accCompostCustomerText").text(isCompostCustomer ? "Yes" : "No");

            accCropRows = (user.farmer.crops || []).map(function (c) {
                return {
                    id: c.cropListManagement ? c.cropListManagement.id : null,
                    name: c.cropListManagement ? c.cropListManagement.name : "-",
                    sellprice: c.price != null ? c.price : null,
                    status: c.status || "Pending",
                    isNew: false
                };
            });
            renderAccCropsTable();
            loadAccCropOptions();

            $("#accCompostDue").text(
                user.farmer.dueamount != null ? formatAccCurrency(user.farmer.dueamount) : "-"
            );

        } else if (user.accounttype === "Supplier" && user.supplier) {
            $("#navTabIngredients").removeClass("d-none");

            accIngredientRows = (user.supplier.ingredients || []).map(function (i) {
                return {
                    id: i.ingredient ? i.ingredient.id : null,
                    name: i.ingredient ? i.ingredient.name : "-",
                    sellprice: i.price != null ? i.price : null,
                    status: i.status || "Pending",
                    isNew: false
                };
            });
            renderAccIngredientsTable();
            loadAccIngredientOptions();

        } else if (user.accounttype === "Supermarket" && user.supermarket) {
            $("#navTabBalance").removeClass("d-none");
            $("#accSupermarketDue").text(
                user.supermarket.due != null ? formatAccCurrency(user.supermarket.due) : "-"
            );
        }
    }

// ============================================================
// FARMER — crop dropdown + staged table
// ============================================================
    function loadAccCropOptions() {
        $.ajax({
            url: "/crop/croplist/dropdown/selected",
            method: "GET",
            success: function (crops) {
                const select = $("#accSelectCrop");
                select.find("option:not(:first)").remove();
                (crops || []).forEach(function (c) {
                    select.append('<option value="' + c.id + '">' + c.name + "</option>");
                });
            },
            error: function () {
                // non-fatal — dropdown just stays empty if this endpoint differs
            }
        });
    }

    function renderAccCropsTable() {
        const body = $("#accCropsTableBody").empty();
        if (accCropRows.length === 0) {
            body.append('<tr><td colspan="5" class="text-muted text-center">No crops added yet.</td></tr>');
            return;
        }
        accCropRows.forEach(function (row, index) {
            body.append(
                "<tr>" +
                "<td>" + (index + 1) + "</td>" +
                "<td>" + row.name + "</td>" +
                "<td>" + (row.sellprice != null ? row.sellprice : "-") + "</td>" +
                "<td>" + row.status + "</td>" +
                '<td><button type="button" class="btn btn-sm btn-outline-danger acc-remove-crop" data-index="' + index + '">' +
                '<i class="fa-solid fa-trash"></i></button></td>' +
                "</tr>"
            );
        });
    }

// ============================================================
// SUPPLIER — ingredient dropdown + staged table
// FIXED: endpoint corrected to match real IngredientController,
// and table rendering actually builds rows now (was reassigning
// accIngredientRows from an out-of-scope `user` variable and never
// touching the DOM — would have thrown ReferenceError on first use).
// ============================================================
    function loadAccIngredientOptions() {
        $.ajax({
            url: "/ingredient/ingredientlist/dropdown/selected",
            method: "GET",
            success: function (ingredients) {
                const select = $("#accSelectIngredient");
                select.find("option:not(:first)").remove();
                (ingredients || []).forEach(function (i) {
                    select.append('<option value="' + i.id + '">' + i.name + "</option>");
                });
            },
            error: function () {
                // non-fatal — dropdown just stays empty if this endpoint differs
            }
        });
    }

    function renderAccIngredientsTable() {
        const body = $("#accIngredientsTableBody").empty();
        if (accIngredientRows.length === 0) {
            body.append('<tr><td colspan="5" class="text-muted text-center">No ingredients added yet.</td></tr>');
            return;
        }
        accIngredientRows.forEach(function (row, index) {
            body.append(
                "<tr>" +
                "<td>" + (index + 1) + "</td>" +
                "<td>" + row.name + "</td>" +
                "<td>" + (row.sellprice != null ? row.sellprice : "-") + "</td>" +
                "<td>" + row.status + "</td>" +
                '<td><button type="button" class="btn btn-sm btn-outline-danger acc-remove-ingredient" data-index="' + index + '">' +
                '<i class="fa-solid fa-trash"></i></button></td>' +
                "</tr>"
            );
        });
    }

    function formatAccCurrency(value) {
        const num = Number(value);
        if (isNaN(num)) return "-";
        return "Rs. " + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatAccDate(value) {
        if (!value) return "-";
        const d = new Date(value);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

// ============================================================
// EVENTS
// ============================================================
    function bindAccountEvents() {

        $("#accImageInput").on("change", function (e) {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith("image/")) {
                Notiflix.Notify.failure("Please choose an image file.");
                return;
            }
            if (file.size > 3 * 1024 * 1024) {
                Notiflix.Notify.failure("Image must be under 3MB.");
                return;
            }
            const reader = new FileReader();
            reader.onload = function (ev) {
                accPendingImageBase64 = ev.target.result;
                accPendingImageRemoved = false;
                $("#accAvatarImg").attr("src", accPendingImageBase64).show();
                $("#accAvatarFallback").hide();
                $("#accImageActions").show();
            };
            reader.readAsDataURL(file);
        });

        $("#accImageCancel").on("click", function () {
            accPendingImageBase64 = null;
            accPendingImageRemoved = false;
            $("#accImageInput").val("");
            $("#accImageActions").hide();
            renderAccount(accCurrentUser);
        });

        $("#accImageRemove").on("click", function () {
            accPendingImageBase64 = null;
            accPendingImageRemoved = true;
            $("#accAvatarImg").hide();
            $("#accAvatarFallback").show();
            $("#accImageActions").show();
        });

        $("#accImageSave").on("click", function () {
            const payload = {
                id: accCurrentUser.id,
                imageBase64: accPendingImageRemoved ? null : accPendingImageBase64,
                imageRemoved: accPendingImageRemoved
            };
            $.ajax({
                url: "/user/account/me/photo",
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (res) {
                    if (res === "OK") {
                        Notiflix.Notify.success("Profile photo updated.");
                        accPendingImageBase64 = null;
                        accPendingImageRemoved = false;
                        $("#accImageActions").hide();
                        loadMyAccount();
                    } else {
                        Notiflix.Notify.failure(res);
                    }
                },
                error: function () {
                    Notiflix.Notify.failure("Could not update photo.");
                }
            });
        });

        $("#accDetailsReset").on("click", function () {
            renderAccount(accCurrentUser);
        });

        $("#formAccountDetails").on("submit", function () {
            const username = $("#accUsername").val().trim();
            const email = $("#accEmail").val().trim();

            if (!username || !email) {
                Notiflix.Notify.failure("Username and email are required.");
                return false;
            }

            const payload = {
                id: accCurrentUser.id,
                username: username,
                email: email,
                note: $("#accNote").val().trim()
            };

            $.ajax({
                url: "/user/account/me",
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (res) {
                    if (res === "OK") {
                        Notiflix.Notify.success("Account details updated.");
                        loadMyAccount();
                    } else {
                        Notiflix.Notify.failure(res);
                    }
                },
                error: function () {
                    Notiflix.Notify.failure("Could not update account details.");
                }
            });
            return false;
        });

        $("[data-toggle-pw]").on("click", function () {
            const targetId = $(this).data("toggle-pw");
            const input = $("#" + targetId);
            const icon = $(this).find("i");
            if (input.attr("type") === "password") {
                input.attr("type", "text");
                icon.removeClass("fa-eye").addClass("fa-eye-slash");
            } else {
                input.attr("type", "password");
                icon.removeClass("fa-eye-slash").addClass("fa-eye");
            }
        });

        $("#accNewPassword").on("input", function () {
            const val = $(this).val();
            let score = 0;
            if (val.length >= 8) score += 1;
            if (/[A-Z]/.test(val)) score += 1;
            if (/[0-9]/.test(val)) score += 1;
            if (/[^A-Za-z0-9]/.test(val)) score += 1;

            const bar = $("#accPwStrengthBar");
            const pct = (score / 4) * 100;
            const colors = ["#dc3545", "#dc3545", "#ffc107", "#28a745", "#28a745"];
            bar.css({ width: pct + "%", background: colors[score] });
        });

        $("#accPasswordReset").on("click", function () {
            $("#formAccountPassword")[0].reset();
            $("#accPwStrengthBar").css("width", "0%");
        });

        $("#formAccountPassword").on("submit", function () {
            const current = $("#accCurrentPassword").val();
            const next = $("#accNewPassword").val();
            const confirm = $("#accConfirmPassword").val();

            if (!current || !next || !confirm) {
                Notiflix.Notify.failure("All password fields are required.");
                return false;
            }
            if (next.length < 8) {
                Notiflix.Notify.failure("New password must be at least 8 characters.");
                return false;
            }
            if (next !== confirm) {
                Notiflix.Notify.failure("New password and confirmation do not match.");
                return false;
            }
            if (next === current) {
                Notiflix.Notify.failure("New password must be different from the current password.");
                return false;
            }

            Notiflix.Confirm.show(
                "Update password",
                "You'll need to use the new password next time you log in. Continue?",
                "Yes, update",
                "Cancel",
                function () {
                    $.ajax({
                        url: "/user/account/me/password",
                        method: "PUT",
                        contentType: "application/json",
                        data: JSON.stringify({
                            currentPassword: current,
                            newPassword: next
                        }),
                        success: function (res) {
                            if (res === "OK") {
                                Notiflix.Notify.success("Password updated.");
                                $("#formAccountPassword")[0].reset();
                                $("#accPwStrengthBar").css("width", "0%");
                            } else {
                                Notiflix.Notify.failure(res);
                            }
                        },
                        error: function (xhr) {
                            if (xhr.status === 401 || xhr.status === 403) {
                                Notiflix.Notify.failure("Current password is incorrect.");
                            } else {
                                Notiflix.Notify.failure("Could not update password.");
                            }
                        }
                    });
                }
            );
            return false;
        });

        $("#accButtonAddCrop").on("click", function () {
            const select = $("#accSelectCrop");
            const cropId = select.val();
            const cropName = select.find("option:selected").text();
            const price = parseFloat($("#accCropPrice").val());

            if (!cropId) {
                Notiflix.Notify.failure("Please select a crop.");
                return;
            }
            if (isNaN(price) || price <= 0) {
                Notiflix.Notify.failure("Please enter a valid price.");
                return;
            }
            if (accCropRows.some(function (r) { return String(r.id) === String(cropId); })) {
                Notiflix.Notify.failure("This crop is already in your list.");
                return;
            }

            accCropRows.push({ id: cropId, name: cropName, sellprice: price, status: "Pending", isNew: true });
            renderAccCropsTable();

            select.val("");
            $("#accCropPrice").val("");
        });

        $("#accCropsTableBody").on("click", ".acc-remove-crop", function () {
            const index = $(this).data("index");
            accCropRows.splice(index, 1);
            renderAccCropsTable();
        });

        $("#accCropsSave").on("click", function () {
            if (accCropRows.length === 0) {
                Notiflix.Notify.failure("Add at least one crop before saving.");
                return;
            }
            const payload = accCropRows.map(function (r) {
                return { cropId: r.id, sellprice: r.sellprice };
            });

            $.ajax({
                url: "/user/account/me/crops",
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (res) {
                    if (res === "OK") {
                        Notiflix.Notify.success("Crop prices submitted. Pending items need approval before going Active.");
                        loadMyAccount();
                    } else {
                        Notiflix.Notify.failure(res);
                    }
                },
                error: function () {
                    Notiflix.Notify.failure("Could not save crop prices.");
                }
            });
        });

        $("#accButtonAddIngredient").on("click", function () {
            const select = $("#accSelectIngredient");
            const ingredientId = select.val();
            const ingredientName = select.find("option:selected").text();
            const price = parseFloat($("#accIngredientPrice").val());

            if (!ingredientId) {
                Notiflix.Notify.failure("Please select an ingredient.");
                return;
            }
            if (isNaN(price) || price <= 0) {
                Notiflix.Notify.failure("Please enter a valid price.");
                return;
            }
            if (accIngredientRows.some(function (r) { return String(r.id) === String(ingredientId); })) {
                Notiflix.Notify.failure("This ingredient is already in your list.");
                return;
            }

            accIngredientRows.push({ id: ingredientId, name: ingredientName, sellprice: price, status: "Pending", isNew: true });
            renderAccIngredientsTable();

            select.val("");
            $("#accIngredientPrice").val("");
        });

        $("#accIngredientsTableBody").on("click", ".acc-remove-ingredient", function () {
            const index = $(this).data("index");
            accIngredientRows.splice(index, 1);
            renderAccIngredientsTable();
        });

        $("#accIngredientsSave").on("click", function () {
            if (accIngredientRows.length === 0) {
                Notiflix.Notify.failure("Add at least one ingredient before saving.");
                return;
            }
            const payload = accIngredientRows.map(function (r) {
                return { ingredientId: r.id, sellprice: r.sellprice };
            });

            $.ajax({
                url: "/user/account/me/ingredients",
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(payload),
                success: function (res) {
                    if (res === "OK") {
                        Notiflix.Notify.success("Ingredient prices submitted. Pending items need approval before going Active.");
                        loadMyAccount();
                    } else {
                        Notiflix.Notify.failure(res);
                    }
                },
                error: function () {
                    Notiflix.Notify.failure("Could not save ingredient prices.");
                }
            });
        });
    }

})();