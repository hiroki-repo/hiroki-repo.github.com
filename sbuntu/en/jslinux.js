/* 
   Linux launcher

   Copyright (c) 2011-2012 Fabrice Bellard

   Redistribution or commercial use is prohibited without the author's
   permission.
*/
"use strict";

var term, pc, boot_start_time, init_state;

function term_charge_handle_put(str)
{
    var el;
    el = document.getElementById("term_charge_handle");
    el.value = str;
}

function term_charge_handle_get()
{
    var el;
    el = document.getElementById("term_charge_handle");
    return el.value;
    //el.value = val;
}

function term_start()
{
    term = new Term(80, 30, term_handler);

    term.open();
}

/* send chars to the serial port */
function term_handler(str)
{
    pc.serial.send_chars(str);
}

function clipboard_set(val)
{
    var el;
    el = document.getElementById("text_clipboard");
    el.value = val;
}

function clipboard_get()
{
    var el;
    el = document.getElementById("text_clipboard");
    return el.value;
}

function keyoutputforjsl(val)
{
    var el;
    el = document.getElementById("keyinputforjsl2");
    el.value = val;
}

function keyinputforjsl()
{
    var el;
    el = document.getElementById("keyinputforjsl2");
    return el.value;
    //term_handler(el.value);
    el.value="";
}

function keyinputforjsl_ud()
{
    var el;
    el = document.getElementById("keyinputforjsl2");
    return el.value;
    //term_handler(el.value);
    //el.value="";
}

function dspwo_get()
{
    var el;
    el = document.getElementById("dispwebosapps");
    return el.value;
    //el.value = "";
}

function wlw_procset()
{
    var el="";
    el = clipboard_get();
    var ctp=[];
    var x;
    var ctps="";
    var ctpesc1;
    ctpesc1="";
    if(el.substr(0,1) == ctpesc1){
    ctp[x]=el.substr(1);
    x++;
     for (var i = 0; i < x; i++) {
     ctps += ctp[i];
     //document.write(ctp[i]);
     }
     var webosruntimep = setInterval(function() {
     var node = document.getElementById("dispwebosapps");
     //node.innerHTML = ctps;
     node.innerHTML = el.substr(1);
     clearInterval(webosruntimep);
     }, 1000);
     clipboard_set("");
    }
    //return ctps.value;
}

function wlcall_set(val)
{
    var el;
    //el = document.getElementById("text_clipboard");
    el.value = val;
}

function wlcall_get()
{
    var el;
    //el = document.getElementById("text_clipboard");
    return el.value;
}

function clear_clipboard()
{
    var el;
    el = document.getElementById("text_clipboard");
    el.value = "";
}

/* just used to display the boot time in the VM */
function get_boot_time()
{
    return (+new Date()) - boot_start_time;
}

function start()
{
    var params;
    
    init_state = new Object();

    params = new Object();

    /* serial output chars */
    params.serial_write = term.write.bind(term);

    /* memory size (in bytes) */
    params.mem_size = 16 * 1024 * 1024;

    /* clipboard I/O */
    params.clipboard_get = clipboard_get;
    params.clipboard_set = clipboard_set;

    params.get_boot_time = get_boot_time;

    /* IDE drive. The raw disk image is split into files of
     * 'block_size' KB. 
     */
    //params.hda = { url: "hda%d.bin", block_size: 64, nb_blocks: 912 };

    pc = new PCEmulator(params);

    init_state.params = params;
    
    var urloptdata=urloptget();

    /* Add JSModem for networking:
     *  - register ttyS2 as COM2 with io port 2f8 and irq 3;
     *  - connect websocket to server at localhost:2080 (will be 
     *    redirected on the server-side).
     */
    var modem = new JSModem(pc);
    if (urloptdata.ssled == "1"){
    if ((urloptdata.relay)){modem.connect(urloptdata.relay, 2080, 1);}else{modem.connect('localhost', 2080, 1);}}else{
    if ((urloptdata.relay)){modem.connect(urloptdata.relay, 2080);}else{modem.connect('localhost', 2080);}}
    
    pc.load_binary("vmlinux-2.6.20.bin", 0x00100000, start2);
}

function start2(ret)
{
    if (ret < 0)
        return;
    init_state.start_addr = 0x10000;
    init_state.initrd_size = 0;
    //pc.load_binary("linuxstart.bin", init_state.start_addr, start3);
    pc.load_binary("linuxstart.bin", init_state.start_addr, start3_);
}

function start3(ret)
{
    var block_list;
    if (ret < 0)
        return;
    /* Preload blocks so that the boot time does not depend on the
     * time to load the required disk data (optional) */
    block_list = [ 0, 7, 3, 643, 720, 256, 336, 644, 781, 387, 464, 475, 131, 589, 468, 472, 474, 776, 777, 778, 779, 465, 466, 473, 467, 469, 470, 512, 592, 471, 691, 697, 708, 792, 775, 769 ];
    pc.ide0.drives[0].bs.preload(block_list, start4);
}

function start3_(ret)
{
    if (ret < 0)
        return;
    pc.load_binary("root.bin", 0x00400000, start4);
}

function start4(ret)
{
    var cmdline_addr;

    if (ret < 0)
        return;

    /* Assume booting from /dev/ram0 - result of previous load_binary("root.bin") call equals to the 
     * size of the ram image.
     */
    init_state.initrd_size = ret;

    /* set the Linux kernel command line */
    cmdline_addr = 0xf800;
    //pc.cpu.write_string(cmdline_addr, "console=ttyS0 root=/dev/hda ro init=/sbin/init notsc=1 hdb=none");
    pc.cpu.write_string(cmdline_addr, "console=ttyS0 root=/dev/ram0 rw init=/sbin/init notsc=1");

    pc.cpu.eip = init_state.start_addr;
    pc.cpu.regs[0] = init_state.params.mem_size; /* eax */
    pc.cpu.regs[3] = init_state.initrd_size; /* ebx = initrd_size (optional ram disk - old jslinux booting) */
    pc.cpu.regs[1] = cmdline_addr; /* ecx */

    boot_start_time = (+new Date());

    pc.start();
}

term_start();
