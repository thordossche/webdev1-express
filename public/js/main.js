function update(type, id){
    $.ajax({
        type: 'PATCH',
        url: '/' + type + '/' + id + '/' + 'update',
        data: $('#' + type + '_form').serialize(),
        success: function (response) {
            window.location.assign('/' + type + '/' + id);
        },
        error: function(err) {
            errs = JSON.parse(err.responseText).errors;
            html = "";
            errs.forEach( err => {
                html += "<div><div class='alert'>"+err.msg+"</div></div>"
            });
            document.getElementById('error').innerHTML = html;
        }
    });
}

function deleteResource(type, id, al=true){
        if (al) alert("This & all other related entries will (if needed) also be removed.");
        fetch('/' + type + '/' + id, {
            method: 'delete',
        }).then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            }
        })
}


function acceptProduct(productid){
    fetch('/product/' + productid + '/accept', {
        method: 'PATCH'
    }).then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        }
    })
}
